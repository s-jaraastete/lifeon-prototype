import Link from 'next/link'
import React from 'react'
// Icons
import { LuX, LuTrash2, LuShoppingCart, LuChevronRight } from 'react-icons/lu'


type Item = {
  id: number
  title: string
  subtitle?: string
}

const mockItems: Item[] = [
  { id: 1, title: 'EJ: Módulo MIPER' },
  { id: 2, title: 'EJ: Módulo MIPER2' },
  { id: 3, title: 'Investigación de accidentes' },
]

const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      {/* overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* drawer */}
      <aside
        role="dialog"
        aria-modal={isOpen}
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'}`}
      >
        <div className="flex items-center justify-between p-5">
          <h3 className="text-2xl font-semibold">Carrito</h3>
          <button aria-label="Cerrar" onClick={onClose} className="p-1 rounded cursor-pointer hover:bg-gray-100">
            <LuX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 h-[calc(100%-210px)] overflow-y-auto">
          {mockItems.length > 0 && (
            <p className="text-sm text-primary-text mb-4">Agregaste {mockItems.length} módulos</p>
          )}

          <ul className="flex flex-col gap-4">
            {mockItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">ICO</div>
                  <div>
                    <div className="text-sm font-medium">{item.title}</div>
                  </div>
                </div>

                <button className="text-red-500 p-2 rounded cursor-pointer hover:bg-red-50">
                  <LuTrash2 />
                </button>
              </li>
            ))}
          </ul>

          {mockItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LuShoppingCart className="w-10 h-10 mx-auto mb-4 text-secondary" />
              <div className="text-2xl font-semibold">Carrito vacío</div>
              <div className="mt-2 text-primary-text">Agrega módulos a tu carrito</div>
            </div>
          )}
        </div>

        {mockItems.length > 0 && (
          <div className="p-5">
            <Link href="/basket">
              <button className="w-full bg-red-500 text-white py-3 rounded-xl font-medium cursor-pointer transition duration-200 hover:bg-red-600">
                  Configura tu paquete
                  <LuChevronRight className="w-4 h-4 inline-block ml-2" />
              </button>
            </Link>
            <p className="text-xs text-secondary-text mt-2 text-center">
              Para obtener el precio de tu módulo o paquete de módulos, debes ir a Configurar tu paquete.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
};

export default CartDrawer;