
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_, cast, String,and_
from typing import Dict, List,Optional
from datetime import datetime, timedelta
from app.models.db.decision import Decision

from app.models.db.application import Application
from app.core.lifecycle.states import ApplicationStatus

class PortfolioService:
    """
    Analytical service for the CRO / Admin Dashboard.
    Aggregates real-time portfolio metrics directly in the DB.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_portfolio_overview(self) -> Dict:
        """
        Returns high-level KPI cards: Volume, Approval Rate, ROI, Score.
        """
        # 1. Total Applications
        total_apps = self.db.query(func.count(Application.id)).scalar() or 0
        
        # 2. Approval Rate
        # Scored = Anything past SUBMITTED
        scored_count = self.db.query(func.count(Application.id)).filter(
            Application.status.notin_([ApplicationStatus.CREATED, ApplicationStatus.SUBMITTED])
        ).scalar() or 0
        
        # Approved = OFFERED or better
        approved_count = self.db.query(func.count(Application.id)).filter(
            Application.status.in_([
                ApplicationStatus.OFFERED, 
                ApplicationStatus.ACCEPTED, 
                ApplicationStatus.FUNDED,
                ApplicationStatus.ACTIVE,
                ApplicationStatus.CLOSED
            ])
        ).scalar() or 0
        
        approval_rate = (approved_count / scored_count * 100) if scored_count > 0 else 0.0

        # 3. Funded Volume & ROI (Accepted + Funded)
        # We consider 'ACCEPTED' as committed capital for this view
        funded_stats = self.db.query(
            func.sum(Application.approved_amount).label('total_volume'),
            func.sum(Application.expected_value).label('total_ev'),
            func.avg(Application.credit_score).label('avg_score')
        ).filter(
            Application.status.in_([
                ApplicationStatus.ACCEPTED, 
                ApplicationStatus.FUNDED, 
                ApplicationStatus.ACTIVE, 
                ApplicationStatus.CLOSED
            ])
        ).first()

        total_funded = funded_stats.total_volume or 0.0
        total_ev = funded_stats.total_ev or 0.0
        avg_score = funded_stats.avg_score or 0.0

        # ROI = Total Expected Profit / Total Investment
        expected_roi = (total_ev / total_funded * 100) if total_funded > 0 else 0.0

        return {
            "total_applications": total_apps,
            "approval_rate": round(approval_rate, 2),
            "total_funded_volume": round(total_funded, 2),
            "expected_roi": round(expected_roi, 2),
            "avg_credit_score": int(avg_score)
        }

    def get_tier_distribution(self) -> Dict[str, int]:
        """
        Returns count of applications by Risk Tier.
        """
        results = (
            self.db.query(Application.current_tier, func.count(Application.id))
            .filter(Application.current_tier.isnot(None))
            .group_by(Application.current_tier)
            .all()
        )
        
        data = {}
        for tier, count in results:
            # Handle if tier is Enum object or string
            key = tier.value if hasattr(tier, "value") else str(tier)
            data[key] = count
            
        return data

    def get_volume_trends(self, days: int = 30) -> List[Dict]:
        """
        Returns daily aggregations for the Volume Trend Chart.
        Metrics: Total Applications (Count) vs. Funded Volume ($).
        Grouped by Creation Date (Vintage View).
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Group by Day
        # func.date_trunc('day', ...) is standard Postgres
        results = self.db.query(
            func.date_trunc('day', Application.created_at).label('day'),
            func.count(Application.id).label('total_apps'),
            func.sum(case(
                (Application.status.in_([
                    ApplicationStatus.ACCEPTED, 
                    ApplicationStatus.FUNDED, 
                    ApplicationStatus.ACTIVE, 
                    ApplicationStatus.CLOSED
                ]), Application.approved_amount),
                else_=0
            )).label('funded_vol')
        ).filter(
            Application.created_at >= start_date
        ).group_by('day').order_by('day').all()
        
        trends = []
        for day, apps, vol in results:
            if day:
                trends.append({
                    "date": str(day)[:10], # YYYY-MM-DD
                    "applications": apps,
                    "funded_volume": vol or 0
                })
                
        return trends

    # def get_recent_activity(self, limit: int = 10):
    #     """
    #     Returns the 'Live Queue' table data.
    #     """
    #     return (
    #         self.db.query(Application)
    #         .order_by(Application.updated_at.desc())
    #         .limit(limit)
    #         .all()
    #     )
  
    def get_recent_activity(
    self,
    limit: int = 10,
    offset: int = 0,
    search: Optional[str] = None,
):
    

        query = self.db.query(Application)

        if search and search.strip():
            terms = search.strip().split()

            filters = []

            # 1️⃣ Applicant full name search (AND terms)
            name_filter = and_(*[
                cast(
                    Application.input_data["applicant"]["full_name"],
                    String
                ).ilike(f"%{term}%")
                for term in terms
            ])
            filters.append(name_filter)

            # 2️⃣ Application ID search (UUID partial match)
            if len(search) >= 8:
                filters.append(
                    cast(Application.id, String).ilike(f"%{search}%")
                )

            # 3️⃣ Decision history search (AND terms)
            decision_subquery = (
                self.db.query(Decision.application_id)
                .filter(
                    and_(*[
                        cast(Decision.input_snapshot, String).ilike(f"%{term}%")
                        for term in terms
                    ])
                )
                .scalar_subquery()
            )
            filters.append(Application.id.in_(decision_subquery))

            # ✅ Apply OR across valid search domains
            query = query.filter(or_(*filters))

        return (
            query.order_by(Application.updated_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )