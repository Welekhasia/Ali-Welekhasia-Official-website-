/**
 * Migration 004: Payment Channel & Financial Telemetry Standardization
 *
 * CRITICAL INVARIANT:
 * Historical paid orders must remain completely durable.
 * Financial facts (Amount, Currency, Payment Status, Payment Reference, Timestamps)
 * must NEVER be rewritten or destroyed.
 */

export const migration = {
    id: "004_payment_telemetry",
    version: 4,
    description: "Standardizes order records with payment channel differentiation, gateway fee tracking, net settlement, and card country telemetry.",
    date: "2026-09-15",
    preconditions: (state) => {
        return { satisfied: !!state.orders };
    },
    apply: (state) => {
        const nextState = { ...state, orders: { ...state.orders } };

        for (const [id, order] of Object.entries(nextState.orders)) {
            if (!order || typeof order !== 'object') continue;

            // Preserve ALL existing financial facts strictly
            const originalAmount = order.amount;
            const originalCurrency = order.currency;
            const originalStatus = order.paymentStatus;
            const originalReference = order.paymentReference;
            const originalPaidAt = order.paidAt;

            // Determine channel safely without rewriting history
            const rawChannel = (order.paymentChannel || order.channel || order.gatewayChannel || '').toLowerCase();
            let channelType = order.paymentChannel || 'STANDARD';
            if (rawChannel.includes('mobile') || rawChannel.includes('mpesa') || order.paymentProvider === 'MPESA') {
                channelType = 'MPESA';
            } else if (rawChannel.includes('card')) {
                channelType = order.cardCountry === 'KE' || order.cardType === 'local' ? 'LOCAL_CARD' : 'CARD';
            }

            nextState.orders[id] = {
                ...order,
                // Invariants:
                amount: originalAmount,
                currency: originalCurrency,
                paymentStatus: originalStatus,
                paymentReference: originalReference,
                paidAt: originalPaidAt,
                // Standardized telemetry additions (only add if missing)
                paymentChannel: order.paymentChannel || channelType,
                gatewayFee: order.gatewayFee !== undefined ? order.gatewayFee : (order.fee !== undefined ? order.fee : null),
                netSettlement: order.netSettlement !== undefined ? order.netSettlement : null
            };
        }

        return nextState;
    },
    validate: (state) => {
        const errors = [];
        for (const [id, ord] of Object.entries(state.orders || {})) {
            if (ord.paymentStatus === 'PAID') {
                if (ord.amount === undefined || ord.amount === null) {
                    errors.push(`Paid order ${id} missing authoritative amount.`);
                }
                if (!ord.paymentReference) {
                    errors.push(`Paid order ${id} missing paymentReference.`);
                }
            }
        }
        return { valid: errors.length === 0, errors };
    },
    rollback: (state) => {
        // Rollback retains original financial order data intact
        return { ...state };
    }
};
