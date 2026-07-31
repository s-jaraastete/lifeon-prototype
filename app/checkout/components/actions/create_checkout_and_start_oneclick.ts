'use server';

import axiosServerManager from '@/lib/axios_server_manager';

const createCheckoutAndStartOneclick = async (
  checkoutPayload: CheckoutOrderPayload
): Promise<CheckoutFlowResponse> => {
  const payload = {
    company: {
      name: checkoutPayload.company.name,
      company_rut: checkoutPayload.company.company_rut,
      business_activity:
        checkoutPayload.company.business_activity ?? null,
      billing_email: checkoutPayload.company.billing_email,
      billing_address:
        checkoutPayload.company.billing_address ?? null,
      region_id: checkoutPayload.company.region_id,
      commune_id: checkoutPayload.company.commune_id,
    },
    contact: {
      first_name: checkoutPayload.contact.first_name,
      last_name: checkoutPayload.contact.last_name,
      email: checkoutPayload.contact.email,
      phone: checkoutPayload.contact.phone ?? null,
    },
    pack_id: checkoutPayload.pack_id,
    billing_period: checkoutPayload.billing_period,
    coupon_code: checkoutPayload.coupon_code ?? null,
    payment_method: checkoutPayload.payment_method,
  };

  const order = await axiosServerManager(
    '/checkout/order/',
    payload,
    {
      useAccessToken: false,
      method: 'post',
    }
  ) as CheckoutOrderResponse;

  if (!order.subscription_public_id) {
    throw new Error(
      'El backend no entregó el identificador de la suscripción.'
    );
  }

  const inscription = await axiosServerManager(
    `/subscriptions/${order.subscription_public_id}/oneclick/inscription/start/`,
    {},
    {
      useAccessToken: false,
      method: 'post',
    }
  ) as OneclickStartResponse;

  if (!inscription.token || !inscription.url_webpay) {
    throw new Error(
      'No fue posible obtener los datos de redirección de Transbank.'
    );
  }

  return {
    order,
    inscription,
  };
};

export default createCheckoutAndStartOneclick;