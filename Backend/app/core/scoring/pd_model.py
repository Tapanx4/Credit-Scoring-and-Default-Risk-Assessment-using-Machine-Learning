import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from catboost import CatBoostClassifier, Pool
from app.core.config import settings
from app.core.scoring.feature_builder import FeatureBuilder
from pathlib import Path

class ScoringEngine:
    """
    Orchestrates the 2-Stage Model Architecture:
    1. Preprocessing (FeatureBuilder)
    2. Neural Network (Risk Score generation)
    3. CatBoost (Final PD)
    4. Isotonic Regression (Calibration)
    """
    
    _instance = None

    def __new__(cls):
        # Singleton pattern to load models only once
        if cls._instance is None:
            cls._instance = super(ScoringEngine, cls).__new__(cls)
            cls._instance._load_models()
        return cls._instance

    # def _load_models(self):
    #     print("⚡ Loading ML Models...")
    #     path = settings.ARTIFACTS_DIR
        
    #     # Load Auxiliaries
    #     with open(f"{path}embedding_encoders_ipw2.0.pkl", "rb") as f:
    #         self.encoders = pickle.load(f)
    #     with open(f"{path}nn_scaler_ipw2.0.pkl", "rb") as f:
    #         self.scaler = pickle.load(f)
    #     with open(f"{path}isotonic_ipw2.0.pkl", "rb") as f:
    #         self.calibrator = pickle.load(f)
            
    #     # Load Models
    #     self.nn_model = tf.keras.models.load_model(f"{path}final_nn_model_ipw2.0.keras")
    #     self.cat_model = CatBoostClassifier()
    #     self.cat_model.load_model(f"{path}final_catboost_ipw2.0.cbm")
    #     print("✅ Models Loaded.")
    def _load_models(self):
        print("⚡ Loading ML Models...")
        path = settings.ARTIFACTS_DIR

    # Auxiliaries
        with open(path / "embedding_encoders_ipw2.0.pkl", "rb") as f:
            self.encoders = pickle.load(f)

        with open(path / "nn_scaler_ipw2.0.pkl", "rb") as f:
            self.scaler = pickle.load(f)

        with open(path / "isotonic_ipw2.0.pkl", "rb") as f:
            self.calibrator = pickle.load(f)

    # Models
        self.nn_model = tf.keras.models.load_model(
            path / "final_nn_model_ipw2.0.keras"
        )

        self.cat_model = CatBoostClassifier()
        self.cat_model.load_model(
        str(path / "final_catboost_ipw2.0.cbm")  # CatBoost needs str
        )

        print("✅ Models Loaded.")

    def predict(self, raw_data: dict) -> dict:
        """
        Full inference pipeline.
        Returns: { 'calibrated_pd': float, 'score': int, 'grade': str }
        """
        # 1. Build Base Features
        features = FeatureBuilder.build(raw_data)
        df = pd.DataFrame([features])
        
        # 2. Neural Network Inference
        # We must transform the data exactly as trained (Log -> Scale -> Encode)
        nn_inputs = self._prep_nn_inputs(df)
        nn_score = self.nn_model.predict(nn_inputs, verbose=0).flatten()[0]
        
        # 3. Update Feature Set
        df["nn_risk_score"] = float(nn_score)
        
        # 4. CatBoost Inference
        # CatBoost handles the string categoricals natively based on the training pool
        # We ensure column order/existence by selecting what the model expects
        cb_features = self.cat_model.feature_names_
        
        # Safety fill for missing cols in DF that model expects
        for col in cb_features:
            if col not in df.columns:
                df[col] = "Missing" # or 0 depending on type, simplified here
        
        # Predict Raw Probability
        raw_pd = self.cat_model.predict_proba(df[cb_features])[:, 1][0]
        
        # 5. Calibration
        calibrated_pd = self.calibrator.predict([raw_pd])[0]
        
        # 6. Derived Metrics
        # Map PD to a 300-850 Score
        score = int(np.clip(850 - (calibrated_pd * 600), 300, 850))
        # 7. Explainability (SHAP)
        # Calculate SHAP values for this single instance
        pool = Pool(df[cb_features], cat_features=self.cat_model.get_cat_feature_indices())
        shap_values = self.cat_model.get_feature_importance(pool, type='ShapValues')
        
        # Shape: (n_samples, n_features + 1), last column is bias
        # We take the first row, exclude bias
        instance_shap = shap_values[0, :-1]
        
        # Map to feature names and sort by absolute impact
        feature_importance = list(zip(cb_features, instance_shap))
        feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Extract Top 3 Drivers
        top_drivers = []
        for feat, val in feature_importance[:3]:
            impact = "negative" if val > 0 else "positive" # Positive SHAP increases PD (Bad), Negative SHAP decreases PD (Good)
            # Make label human readable
            label = feat.replace('_', ' ').title()
            top_drivers.append({"feature": label, "impact": impact, "value": str(df[feat].iloc[0])})

        return {
            "calibrated_pd": float(calibrated_pd),
            "pd_raw": float(raw_pd),
            "score": score,
            "grade": features.get("grade", "C"), # Fallback or derived
            "model_version": "v1.0_ipw",
            "explanations": top_drivers
        }

    def _prep_nn_inputs(self, df):
        """Prepares the list of inputs required by the Keras functional API."""
        inputs = []
        
        # A. Embeddings (Categoricals)
        embed_cols = ["purpose", "emp_cat"]
        for c in embed_cols:
            # Handle unseen labels by mapping to index 0 (Unknown) if error
            try:
                encoder = self.encoders[c]
                # Safe transform: if label not in encoder, use classes_[0]
                val = df[c].astype(str).iloc[0]
                if val in encoder.classes_:
                    arr = encoder.transform([val])
                else:
                    arr = np.zeros(1) # Index 0
                inputs.append(arr)
            except:
                inputs.append(np.zeros(1))

        # B. Numerics
        numeric_nn_cols = [
            "int_rate","fico_score","credit_age_months",
            "recent_expansion_ratio","debt_service_ratio","utilization_gap",
            "revol_util","dti","annual_inc","loan_amnt","installment",
            "installment_to_income","revol_bal","total_bal_ex_mort","total_bc_limit",
            "tot_cur_bal","tot_hi_cred_lim"
        ]
        
        # Log Transform Heavy Tails (Matching Training Logic)
        log_cols = ["annual_inc","loan_amnt","revol_bal","total_bal_ex_mort","total_bc_limit"]
        
        # Create a copy to manipulate
        num_df = df[numeric_nn_cols].fillna(0).copy()
        
        for col in log_cols:
            if col in num_df.columns:
                num_df[col] = np.log1p(num_df[col])
        
        # Scale
        scaled_numerics = self.scaler.transform(num_df)
        inputs.append(scaled_numerics.astype("float32"))
        
        return inputs