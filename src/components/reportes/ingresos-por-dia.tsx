'use client';

import { useState, useEffect } from 'react';

type IngresosPorDiaData = {
  dia: number;
  monto: number;
};

type TransaccionDetallada = {
  id: string;
  monto: number;
  fecha: Date;
  metodoPago: string;
  notas: string;
  socioNombre: string;
};

export function IngresosPorDia() {
  const [año, setAño] = useState<number>(new Date().getFullYear());
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ingresos, setIngresos] = useState<IngresosPorDiaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionDetallada[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];

  // Obtener ingresos por día
  useEffect(() => {
    const fetchIngresos = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/reportes/ingresos-por-dia?año=${año}&mes=${mes}`
        );
        if (response.ok) {
          const data = await response.json();
          setIngresos(data);
          setDiaSeleccionado(null);
          setTransacciones([]);
        }
      } catch (error) {
        console.error('Error al obtener ingresos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngresos();
  }, [año, mes]);

  // Obtener transacciones del día seleccionado
  const handleSelectDia = async (dia: number) => {
    if (diaSeleccionado === dia) {
      setDiaSeleccionado(null);
      setTransacciones([]);
      return;
    }

    setDiaSeleccionado(dia);
    setCargandoDetalle(true);
    try {
      const response = await fetch(
        `/api/reportes/transacciones-por-dia?año=${año}&mes=${mes}&dia=${dia}`
      );
      if (response.ok) {
        const data = await response.json();
        setTransacciones(data);
      }
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const totalMes = ingresos.reduce((sum, item) => sum + item.monto, 0);
  const totalDiaSeleccionado = transacciones.reduce((sum, t) => sum + t.monto, 0);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-700">Ingresos por Día</h2>
      
      {/* Selectores */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Año
          </label>
          <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Mes
          </label>
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {meses.map((m) => (
              <option key={m.num} value={m.num}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Total del mes */}
      {ingresos.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Total del mes</p>
          <p className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
            }).format(totalMes)}
          </p>
        </div>
      )}

      {/* Tabla de ingresos por día */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b font-medium text-gray-900">
            <tr>
              <th className="px-4 py-2">Día</th>
              <th className="px-4 py-2 text-right">Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : ingresos.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-4 text-center text-gray-500">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              ingresos.map((item) => (
                <tbody key={item.dia}>
                  <tr 
                    onClick={() => handleSelectDia(item.dia)}
                    className={`border-b cursor-pointer transition-colors ${
                      diaSeleccionado === item.dia 
                        ? 'bg-blue-100 hover:bg-blue-150' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-600 font-medium">{item.dia}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                      }).format(item.monto)}
                    </td>
                  </tr>

                  {/* Detalle del día seleccionado */}
                  {diaSeleccionado === item.dia && (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 bg-blue-50">
                        {cargandoDetalle ? (
                          <div className="text-center text-gray-600">Cargando transacciones...</div>
                        ) : transacciones.length === 0 ? (
                          <div className="text-center text-gray-600">No hay transacciones en este día</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="mb-4 p-3 bg-blue-100 rounded border border-blue-300">
                              <p className="text-sm text-gray-700 mb-1">Total del día {item.dia}</p>
                              <p className="text-xl font-bold text-blue-700">
                                {new Intl.NumberFormat('es-AR', {
                                  style: 'currency',
                                  currency: 'ARS',
                                }).format(totalDiaSeleccionado)}
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full text-left text-xs bg-white rounded">
                                <thead className="border-b font-semibold text-gray-800 bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2">Socio</th>
                                    <th className="px-3 py-2">Monto</th>
                                    <th className="px-3 py-2">Método</th>
                                    <th className="px-3 py-2">Notas</th>
                                    <th className="px-3 py-2">Hora</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {transacciones.map((t) => (
                                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-700 font-medium">{t.socioNombre}</td>
                                      <td className="px-3 py-2 font-semibold text-green-600">
                                        {new Intl.NumberFormat('es-AR', {
                                          style: 'currency',
                                          currency: 'ARS',
                                        }).format(t.monto)}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 text-xs">{t.metodoPago}</td>
                                      <td className="px-3 py-2 text-gray-600 text-xs max-w-xs truncate">{t.notas}</td>
                                      <td className="px-3 py-2 text-gray-600 text-xs">
                                        {new Date(t.fecha).toLocaleTimeString('es-AR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          timeZone: 'America/Argentina/Buenos_Aires',
                                        })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
