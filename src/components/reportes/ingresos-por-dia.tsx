'use client';

import { useState, useEffect } from 'react';

type IngresosPorDiaData = {
  dia: number;
  monto: number;
};

export function IngresosPorDia() {
  const [año, setAño] = useState<number>(new Date().getFullYear());
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [ingresos, setIngresos] = useState<IngresosPorDiaData[]>([]);
  const [loading, setLoading] = useState(false);

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
        }
      } catch (error) {
        console.error('Error al obtener ingresos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngresos();
  }, [año, mes]);

  const totalMes = ingresos.reduce((sum, item) => sum + item.monto, 0);

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
                <tr key={item.dia} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 font-medium">{item.dia}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    }).format(item.monto)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
