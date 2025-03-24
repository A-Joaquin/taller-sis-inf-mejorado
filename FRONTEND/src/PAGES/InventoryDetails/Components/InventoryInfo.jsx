import PropTypes from "prop-types";

const InventoryInfo = ({ inventory }) => {
  if (!inventory) {
    return <div className="text-red-500">Error: No hay datos de inventario disponibles.</div>;
  }

  const calculateMovementsByType = (movements = []) => {
    return movements.reduce(
      (acc, mov) => {
        const quantity = Math.abs(mov.quantity || 0);
        switch (mov.type) {
          case "sale":
            acc.sales += quantity;
            break;
          case "purchase":
            acc.purchases += quantity;
            break;
          case "adjustment":
            if (mov.quantity < 0) {
              acc.adjustments += quantity;
            }
            break;
          default:
            break;
        }
        return acc;
      },
      { sales: 0, purchases: 0, adjustments: 0 }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Detalles del Inventario</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              inventory.status === "open"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {inventory.status === "open" ? "Abierto" : "Cerrado"}
          </span>
        </div>

        <p className="text-gray-600 mt-2">
          Fecha: {inventory.date ? new Date(inventory.date).toLocaleDateString() : "N/A"} - 
          Hora: {inventory.date ? new Date(inventory.date).toLocaleTimeString() : "N/A"}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Empleado Representante:</h2>
        <div className="flex flex-wrap gap-2">
          {inventory.employees && inventory.employees.length > 0 ? (
            inventory.employees.map((emp) => (
              <span key={emp.employeeCi} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                {emp.name}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No hay empleados asignados.</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Insumos del Inventario:</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingrediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Final
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.ingredients && inventory.ingredients.length > 0 ? (
                inventory.ingredients.map((item) => {
                  const movements = calculateMovementsByType(item.movements || []);
                  const unit = "kg";

                  return (
                    <tr key={item.ingredientId}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.name || "Sin nombre"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.initialStock ? item.initialStock.toFixed(2) : "0.00"} {unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600">
                        {movements.sales > 0 ? `-${movements.sales.toFixed(2)}` : "0.00"} {unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.finalStock ? item.finalStock.toFixed(2) : "0.00"} {unit}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No hay insumos en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inventory.observations && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Observaciones:</h2>
          <p className="text-gray-700 bg-gray-50 p-4 rounded">{inventory.observations}</p>
        </div>
      )}
    </div>
  );
};

InventoryInfo.propTypes = {
  inventory: PropTypes.shape({
    status: PropTypes.oneOf(["open", "closed"]).isRequired,
    date: PropTypes.string,
    employees: PropTypes.arrayOf(
      PropTypes.shape({
        employeeCi: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })
    ),
    ingredients: PropTypes.arrayOf(
      PropTypes.shape({
        ingredientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        initialStock: PropTypes.number.isRequired,
        finalStock: PropTypes.number.isRequired,
        movements: PropTypes.arrayOf(
          PropTypes.shape({
            quantity: PropTypes.number.isRequired,
            type: PropTypes.oneOf(["sale", "purchase", "adjustment"]).isRequired,
          })
        ),
      })
    ),
    observations: PropTypes.string,
  }).isRequired,
};

export default InventoryInfo;
