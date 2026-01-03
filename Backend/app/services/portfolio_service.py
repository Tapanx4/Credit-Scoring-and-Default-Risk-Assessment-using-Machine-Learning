# =============================================================
# services/portfolio_service.py — CRO ANALYTICS
# =============================================================
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List

from app.models.db.application import Application
from app.core.lifecycle.states import ApplicationStatus


class PortfolioService:
    """
    Aggregated portfolio analytics for CRO / Admin dashboards.
    Read-only, no state mutation.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_portfolio_overview(self) -> Dict[str, float]:
        total_apps = self.db.query(func.count(Application.id)).scalar() or 0

        scored_apps = self.db.query(func.count(Application.id)).filter(
            Application.status.notin_(
                [ApplicationStatus.CREATED, ApplicationStatus.SUBMITTED]
            )
        ).scalar() or 0

        approved_apps = self.db.query(func.count(Application.id)).filter(
            Application.status.in_(
                [
                    ApplicationStatus.OFFERED,
                    ApplicationStatus.ACCEPTED,
                    ApplicationStatus.FUNDED,
                    ApplicationStatus.ACTIVE,
                    ApplicationStatus.CLOSED,
                ]
            )
        ).scalar() or 0

        approval_rate = (
            (approved_apps / scored_apps) * 100 if scored_apps > 0 else 0.0
        )

        funded_volume = (
            self.db.query(func.sum(Application.approved_amount))
            .filter(
                Application.status.in_(
                    [
                        ApplicationStatus.FUNDED,
                        ApplicationStatus.ACTIVE,
                        ApplicationStatus.CLOSED,
                    ]
                )
            )
            .scalar()
            or 0.0
        )

        return {
            "total_applications": total_apps,
            "approval_rate": round(approval_rate, 2),
            "total_funded_volume": round(funded_volume, 2),
        }

    def get_tier_distribution(self) -> Dict[str, int]:
        results = (
            self.db.query(Application.current_tier, func.count(Application.id))
            .filter(Application.current_tier.isnot(None))
            .group_by(Application.current_tier)
            .all()
        )
        return {str(tier): count for tier, count in results}

    def get_recent_activity(self, limit: int = 10) -> List[Application]:
        return (
            self.db.query(Application)
            .order_by(Application.updated_at.desc())
            .limit(limit)
            .all()
        )
