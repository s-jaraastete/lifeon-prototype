'use server';

import axiosServerManager from '@/lib/axios_server_manager';
import axios from 'axios';


const getCheckoutBackendErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return 'No fue posible crear la orden.';
  }

  const data = error.response?.data;

  if (!data || typeof data !== 'object') {
    return 'No fue posible crear la orden.';
  }

  const firstMessage = Object.values(data).find((value) => {
    return typeof value === 'string'
      || Array.isArray(value);
  });

  if (typeof firstMessage === 'string') {
    return firstMessage;
  }

  if (
    Array.isArray(firstMessage)
    && typeof firstMessage[0] === 'string'
  ) {
    return firstMessage[0];
  }

  return 'No fue posible crear la orden. Revisa los datos ingresados.';
};

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
    pack_public_id: checkoutPayload.pack_public_id,
    billing_period: checkoutPayload.billing_period,
    coupon_code: checkoutPayload.coupon_code ?? null,
    payment_method: checkoutPayload.payment_method,
  };

  let order: CheckoutOrderResponse;

  try {
    order = await axiosServerManager(
      '/checkout/order/',
      payload,
      {
        useAccessToken: false,
        method: 'post',
      }
    ) as CheckoutOrderResponse;
  } catch (error) {
    throw new Error(
      getCheckoutBackendErrorMessage(error)
    );
  }

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