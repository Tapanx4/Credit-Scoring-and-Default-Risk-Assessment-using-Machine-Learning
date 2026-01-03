from typing import Optional, Dict


LGD_BY_GRADE: Dict[str, float] = {
"A": 0.35,
"B": 0.40,
"C": 0.45,
"D": 0.55,
"E": 0.65,
"F": 0.75,
"G": 0.85,
}


DEFAULT_LGD = 0.55




def get_lgd(grade: Optional[str] = None) -> float:
    if not grade:
        return DEFAULT_LGD
    return LGD_BY_GRADE.get(grade.upper(), DEFAULT_LGD)


