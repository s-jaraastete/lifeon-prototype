import CheckoutForm from './components/CheckoutForm';

const CheckoutPage = () => {
  return (
    <div className="max-w-325 mx-auto py-12.5 px-4 lg:px-0">
      <h1 className="text-[40px] leading-12 font-semibold mb-8">Checkout</h1>

      <CheckoutForm />
    </div>
  );
};

export default CheckoutPage;
