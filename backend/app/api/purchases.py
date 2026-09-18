"""
CarIQ Backend — Purchases Router
"""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.schemas.purchase import PurchaseCreate, PurchaseDetail, PurchaseSummary, PurchaseStatusUpdate
from app.schemas.common import PaginatedResponse
from app.services.purchase_service import PurchaseService
from app.utils.pagination import paginate

router = APIRouter(prefix="/purchases", tags=["Purchases"])


@router.post("", response_model=PurchaseDetail, status_code=201, summary="Create a new purchase/booking request")
async def create_purchase(
    data: PurchaseCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    purchase = await PurchaseService.create_purchase(db, data, current_user.id)
    return await PurchaseService.get_purchase(db, purchase.id, current_user.id)


@router.get("", response_model=PaginatedResponse, summary="List my purchases")
async def list_my_purchases(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    purchases, total = await PurchaseService.list_purchases(
        db, customer_id=current_user.id, page=page, page_size=page_size
    )
    items = [PurchaseSummary.model_validate(p) for p in purchases]
    return paginate(items, total, page, page_size)


@router.get("/{purchase_id}", response_model=PurchaseDetail, summary="Get purchase detail")
async def get_purchase(
    purchase_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    is_admin = current_user.role == "admin"
    return await PurchaseService.get_purchase(
        db, purchase_id,
        customer_id=current_user.id if not is_admin else None,
        is_admin=is_admin,
    )


@router.put("/{purchase_id}/status", response_model=PurchaseDetail, summary="Update purchase status (admin only)")
async def update_purchase_status(
    purchase_id: uuid.UUID,
    data: PurchaseStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_admin),
):
    purchase = await PurchaseService.update_status(db, purchase_id, data, is_admin=True)
    return await PurchaseService.get_purchase(db, purchase.id, is_admin=True)


@router.post("/{purchase_id}/documents", summary="Upload purchase verification document")
async def upload_document(
    purchase_id: uuid.UUID,
    document_type: str = "identity_proof",
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Simulates object storage upload (S3/R2) for purchase verification documents
    (Aadhaar/PAN card, driving license, address proof, income proof).
    """
    from datetime import datetime, timezone
    import uuid as _uuid

    # Verify purchase ownership
    is_admin = current_user.role == "admin"
    await PurchaseService.get_purchase(
        db, purchase_id,
        customer_id=current_user.id if not is_admin else None,
        is_admin=is_admin,
    )

    doc_id = str(_uuid.uuid4())
    storage_key = f"purchases/{purchase_id}/{document_type}_{doc_id[:8]}.pdf"

    return {
        "success": True,
        "message": f"Document '{document_type}' uploaded successfully",
        "data": {
            "document_id": doc_id,
            "document_type": document_type,
            "purchase_id": str(purchase_id),
            "storage_key": storage_key,
            "file_name": f"{document_type}_verified.pdf",
            "file_size_bytes": 1024 * 450,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "status": "verified",
        }
    }

