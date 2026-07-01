import TextInput from '../components/ui/TextInput';
import CheckoutCollapse from './components/CheckoutCollapse';

const CheckoutPage = () => {
  return (
    <div className="max-w-325 mx-auto py-12.5 px-4 lg:px-0">
      <h1 className="text-[40px] leading-12 font-semibold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-2.5">
            <CheckoutCollapse defaultOpen title="Datos personales">
              <div className="grid lg:grid-cols-2 gap-5.5">
                <TextInput
                  label="Nombre"
                  placeholder="Tu nombre"
                />
                <TextInput
                  label="Apellidos"
                  placeholder="Tu apellido"
                />
                <TextInput
                  label="Correo electrónico"
                  placeholder="Tu correo electrónico"
                />
                <TextInput
                  label="Teléfono"
                  placeholder="+56"
                />
              </div>
            </CheckoutCollapse>

            <CheckoutCollapse title="Datos de facturación">
              <div className="h-30">Dirección y datos fiscales</div>
            </CheckoutCollapse>

            <CheckoutCollapse title="Método de pago">
              <div className="h-30">Opciones de pago aquí</div>
            </CheckoutCollapse>
          </div>
        </div>
        <div>{/* Sidebar */}</div>
      </div>
    </div>
  );
};

export default CheckoutPage;
