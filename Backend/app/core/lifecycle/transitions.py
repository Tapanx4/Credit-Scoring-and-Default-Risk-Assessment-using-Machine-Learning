from app.core.lifecycle.states import ApplicationStatus


# Explicit, auditable allowed transitions
ALLOWED_TRANSITIONS = {
ApplicationStatus.CREATED: {
ApplicationStatus.SUBMITTED,
},


ApplicationStatus.SUBMITTED: {
ApplicationStatus.SCORED,
ApplicationStatus.DECLINED,
},


ApplicationStatus.SCORED: {
ApplicationStatus.OFFERED,
ApplicationStatus.MANUAL_REVIEW,
ApplicationStatus.DECLINED,
},


ApplicationStatus.MANUAL_REVIEW: {
ApplicationStatus.OFFERED,
ApplicationStatus.DECLINED,
},


ApplicationStatus.OFFERED: {
ApplicationStatus.ACCEPTED,
ApplicationStatus.DECLINED,
},


ApplicationStatus.ACCEPTED: {
ApplicationStatus.FUNDED,
},


ApplicationStatus.FUNDED: {
ApplicationStatus.ACTIVE,
},


ApplicationStatus.ACTIVE: {
ApplicationStatus.CLOSED,
ApplicationStatus.DEFAULTED,
},

ApplicationStatus.DECLINED: {
ApplicationStatus.OFFERED, 
ApplicationStatus.MANUAL_REVIEW
},
# Terminal states
ApplicationStatus.CLOSED: set(),
ApplicationStatus.DEFAULTED: set()
}




def validate_transition(current: ApplicationStatus, next_state: ApplicationStatus) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if next_state not in allowed:
        raise ValueError(f"Illegal transition: {current} -> {next_state}")