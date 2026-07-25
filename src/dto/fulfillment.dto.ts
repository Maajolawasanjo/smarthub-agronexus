import { FulfillmentTimelineItemDTO, FulfillmentAvailableActions } from "@/lib/fulfillment";
import { OrderItemDTO } from "./commerce.dto";

export interface LogisticsPartnerDTO {
  id: string;
  companyName: string;
  contactName: string | null;
  phoneNumber: string;
  email: string | null;
}

export interface ShipmentDTO {
  id: string;
  trackingNumber: string | null;
  deliveryStatus: string;
  deliveryAddress: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  logisticsPartner: LogisticsPartnerDTO | null;
}

export interface FulfillmentDTO {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    updatedAt: string;
    status: string; // OrderStatus
    totalAmount: number;
    buyer: {
      id: string;
      fullName: string;
      email: string;
      phoneNumber: string;
      address?: string;
    };
    farmer?: {
      id: string;
      farmName: string;
      farmAddress: string;
      state: string;
    };
    items: OrderItemDTO[];
  };
  shipment: ShipmentDTO | null;
  trackingTimeline: FulfillmentTimelineItemDTO[];
  currentStage: string;
  escrowStatus: {
    locked: boolean;
    status: string; // PaymentStatus
    releaseEligible: boolean;
  };
  availableActions: FulfillmentAvailableActions;
}
