import CheckoutSections from './components/CheckoutSections';

const CheckoutPage = () => {
  return (
    <div className="max-w-325 mx-auto py-12.5 px-4 lg:px-0">
      <h1 className="text-[40px] leading-12 font-semibold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <CheckoutSections />
        </div>
        <div>{/* Sidebar */}</div>
      </div>
    </div>
  );
};

export default CheckoutPage;
