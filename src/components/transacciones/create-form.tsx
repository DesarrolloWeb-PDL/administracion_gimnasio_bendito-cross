'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { createTransaccion } from '@/lib/actions-transacciones';
import SuscripcionSearchSelect from './suscripcion-search-select';
import { useRouter } from 'next/navigation';
import TicketReceipt from './ticket-receipt';

type SuscripcionWithRelations = {
  id: string;
  socio: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    telefono?: string | null;
    cuentaCorriente?: {
      id: string;
      saldoDeuda: number;
      saldoCredito: number;
      estado: string;
    } | null;
  };
  plan: { nombre: string; precio: number };
};

// Interfaz para el estado de la acción
interface ActionState {
  errors?: {
    suscripcionId?: string[];
    monto?: string[];
    metodoPago?: string[];
    fecha?: string[];
    notas?: string[];
  };
  message?: string;
  success?: boolean;
  transaccion?: any; 
}

export default function Form({ suscripciones, logoUrl }: { suscripciones: SuscripcionWithRelations[], logoUrl?: string | null }) {
  const initialState: ActionState = { message: '', errors: {} };
  const [state, dispatch, isPending] = useActionState(createTransaccion, initialState);
  const router = useRouter();
  const [showTicket, setShowTicket] = useState(false);
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<SuscripcionWithRelations | null>(null);
  const [incluirCuentaCorriente, setIncluirCuentaCorriente] = useState(false);
  const [montoCuota, setMontoCuota] = useState<number>(0);
  const [montoCuentaCorriente, setMontoCuentaCorriente] = useState<number>(0);
  
  const totalACobrar = montoCuota + montoCuentaCorriente;

  // Detectar éxito y mostrar ticket
  useEffect(() => {
    if (state.success && state.transaccion) {
      setShowTicket(true);
    }
  }, [state.success, state.transaccion]);

  const handleCloseTicket = () => {
    setShowTicket(false);
    // Redirigir a la lista de transacciones después de cerrar el ticket
    router.push('/admin/transacciones');
    router.refresh();
  };

  // Preparar datos para el ticket
  const ticketData = state.transaccion ? {
    id: state.transaccion.id,
    socioNombre: `${state.transaccion.suscripcion.socio.nombre} ${state.transaccion.suscripcion.socio.apellido}`,
    planNombre: state.transaccion.suscripcion.plan.nombre,
    monto: Number(state.transaccion.monto),
    fecha: state.transaccion.fecha,
    metodoPago: state.transaccion.metodoPago,
    notas: state.transaccion.notas,
    telefonoSocio: state.transaccion.suscripcion.socio.telefono
  } : null;

  const cuentaCorriente = selectedSuscripcion?.socio?.cuentaCorriente;
  const tieneCuentaCorriente = cuentaCorriente && cuentaCorriente.estado === 'ACTIVO';
  const saldoDeuda = tieneCuentaCorriente ? cuentaCorriente.saldoDeuda : 0;
  const saldoCredito = tieneCuentaCorriente ? cuentaCorriente.saldoCredito : 0;
  const saldoNeto = saldoDeuda - saldoCredito;

  return (
    <>
      {showTicket && ticketData && (
        <TicketReceipt data={ticketData} onClose={handleCloseTicket} logoUrl={logoUrl} />
      )}

      <form action={dispatch}>
        <div className="rounded-md bg-gray-50 p-4 md:p-6">
          {/* Suscripción */}
          <div className="mb-4">
            <label htmlFor="suscripcionId" className="mb-2 block text-sm font-medium text-gray-900">
              Seleccionar Suscripción
            </label>
            <SuscripcionSearchSelect 
              suscripciones={suscripciones}
              onSuscripcionChange={(susc) => {
                setSelectedSuscripcion(susc);
                if (susc) {
                  setMontoCuota(susc.plan.precio);
                }
              }}
            />
            <div id="suscripcion-error" aria-live="polite" aria-atomic="true">
              {state.errors?.suscripcionId &&
                state.errors.suscripcionId.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* Alerta de Cuenta Corriente */}
          {selectedSuscripcion && tieneCuentaCorriente && saldoNeto > 0 && (
            <div className="mb-4 rounded-lg border-2 border-orange-300 bg-orange-50 dark:bg-orange-900/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Este socio tiene deuda en cuenta corriente
                  </h3>
                  <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                    <p className="mb-1">Saldo pendiente: <strong>${saldoNeto.toFixed(2)}</strong></p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="incluirCuentaCorriente"
                        checked={incluirCuentaCorriente}
                        onChange={(e) => {
                          setIncluirCuentaCorriente(e.target.checked);
                          if (!e.target.checked) {
                            setMontoCuentaCorriente(0);
                          }
                        }}
                        className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="incluirCuentaCorriente" className="font-medium">
                        Incluir pago de cuenta corriente
                      </label>
                    </div>
                    {incluirCuentaCorriente && (
                      <div className="mt-3">
                        <label htmlFor="montoCuentaCorriente" className="block text-xs font-medium mb-1">
                          Monto para cuenta corriente:
                        </label>
                        <input
                          type="number"
                          id="montoCuentaCorriente"
                          value={montoCuentaCorriente}
                          onChange={(e) => setMontoCuentaCorriente(Number(e.target.value))}
                          step="0.01"
                          min="0"
                          max={saldoNeto}
                          placeholder="0.00"
                          className="w-full rounded-md border border-orange-300 bg-white px-3 py-2 text-sm text-gray-900"
                        />
                        <p className="mt-1 text-xs">
                          Máximo: ${saldoNeto.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden inputs para cuenta corriente */}
          {incluirCuentaCorriente && (
            <>
              <input type="hidden" name="incluirCuentaCorriente" value="true" />
              <input type="hidden" name="montoCuentaCorriente" value={montoCuentaCorriente} />
              <input type="hidden" name="cuentaCorrienteId" value={cuentaCorriente?.id || ''} />
            </>
          )}

          {/* Monto */}
          <div className="mb-4">
            <label htmlFor="monto" className="mb-2 block text-sm font-medium text-gray-900">
              Monto de Cuota {incluirCuentaCorriente && <span className="text-xs text-gray-500">(puede ser 0 si solo paga cuenta corriente)</span>}
            </label>
            <div className="relative mt-2 rounded-md">
              <div className="relative">
                <input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  onChange={(e) => setMontoCuota(parseFloat(e.target.value) || 0)}
                  placeholder="Ingrese el monto"
                  className="peer block w-full rounded-md border border-gray-200 bg-white text-gray-900 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
                  aria-describedby="monto-error"
                />
              </div>
            </div>
            <div id="monto-error" aria-live="polite" aria-atomic="true">
              {state.errors?.monto &&
                state.errors.monto.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* Total a Cobrar */}
          {incluirCuentaCorriente && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Desglose del Pago</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Monto de Cuota:</span>
                  <span className="font-medium">${montoCuota.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Pago Cuenta Corriente:</span>
                  <span className="font-medium">${montoCuentaCorriente.toFixed(2)}</span>
                </div>
                <div className="border-t border-blue-300 dark:border-blue-700 pt-2 mt-2">
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Total a Cobrar:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">${totalACobrar.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fecha */}
          <div className="mb-4">
            <label htmlFor="fecha" className="mb-2 block text-sm font-medium text-gray-900">
              Fecha de Pago (opcional)
            </label>
            <div className="relative">
              <input
                id="fecha"
                name="fecha"
                type="date"
                className="peer block w-full rounded-md border border-gray-200 bg-white text-gray-900 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="fecha-error"
              />
            </div>
            <div id="fecha-error" aria-live="polite" aria-atomic="true">
              {state.errors?.fecha &&
                state.errors.fecha.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">Si no se especifica, se usará la fecha actual</p>
          </div>

          {/* Notas */}
          <div className="mb-4">
            <label htmlFor="notas" className="mb-2 block text-sm font-medium text-gray-900">
              Notas
            </label>
            <div className="relative">
              <input
                id="notas"
                name="notas"
                type="text"
                placeholder="Ej: Pago mensualidad, Compra bebida"
                className="peer block w-full rounded-md border border-gray-200 bg-white text-gray-900 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="notas-error"
              />
            </div>
            <div id="notas-error" aria-live="polite" aria-atomic="true">
              {state.errors?.notas &&
                state.errors.notas.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          {/* Metodo Pago */}
          <div className="mb-4">
            <label htmlFor="metodoPago" className="mb-2 block text-sm font-medium text-gray-900">
              Método de Pago
            </label>
            <div className="relative">
              <select
                id="metodoPago"
                name="metodoPago"
                className="peer block w-full rounded-md border border-gray-200 bg-white text-gray-900 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
                defaultValue=""
                aria-describedby="metodo-error"
              >
                <option value="" disabled>
                  Seleccione un método
                </option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div id="metodo-error" aria-live="polite" aria-atomic="true">
              {state.errors?.metodoPago &&
                state.errors.metodoPago.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
              {state.message && (
                  <p className={`mt-2 text-sm ${state.success ? 'text-green-500' : 'text-red-500'}`} key={state.message}>
                      {state.message}
                  </p>
              )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <Link
            href="/admin/transacciones"
            className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancelar
          </Link>
          <button type="submit" aria-disabled={isPending} className="flex h-10 items-center rounded-lg bg-[var(--primary-color)] px-4 text-sm font-medium text-white transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              {isPending ? 'Registrando...' : 'Registrar Transacción'}
          </button>
        </div>
      </form>
    </>
  );
}
