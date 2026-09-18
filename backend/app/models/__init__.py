"""
CarIQ Backend — Models Package
Import all models here to ensure SQLAlchemy registry is fully populated
and all relationship strings resolve correctly.
"""
from app.models.brand import Brand  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.vehicle import Vehicle, VehicleImage  # noqa: F401
from app.models.variant import Variant  # noqa: F401
from app.models.wishlist import Wishlist  # noqa: F401
from app.models.comparison import Comparison  # noqa: F401
from app.models.recommendation import Recommendation  # noqa: F401
from app.models.purchase import Purchase  # noqa: F401
from app.models.payment import Payment  # noqa: F401
from app.models.finance import FinanceCalculation  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
