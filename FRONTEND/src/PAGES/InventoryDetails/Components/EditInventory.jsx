import { useState } from 'react';
import { useBranch } from '../../../CONTEXTS/BranchContext';
import { 
  updateBranchInventoryRequest,
  closeInventoryToBranchRequest
} from '../../../api/branch';
import { FaBox, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import PropTypes from 'prop-types';

const EditInventory = ({ inventory, onSave, onCancel }) => {
  const { selectedBranch } = useBranch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddMovement, setShowAddMovement] = useState(null); // ingredientId del ingrediente seleccionado
  const [formData, setFormData] = useState({
    ingredients: inventory.ingredients.map(ing => ({
      ...ing,
      newMovement: {
        type: 'adjustment',
        quantity: 0,
        reference: ''
      }
    })),
    observations: inventory.observations || ''
  });

  const handleAddMovement = (ingredientId) => {
    // Crear una función separada para actualizar un ingrediente específico
    const updateIngredient = (ingredient) => {
      if (ingredient.ingredientId !== ingredientId) return ingredient;
      
      const quantity = parseFloat(ingredient.newMovement.quantity);
      if (quantity === 0 || !ingredient.newMovement.reference) return ingredient;
  
      const newMovement = {
        date: new Date(),
        type: ingredient.newMovement.type,
        ingredientId: ingredient.ingredientId,
        ingredientName: ingredient.name,
        quantity: ingredient.newMovement.type === 'loss' ? -Math.abs(quantity) : quantity,
        unit: 'kg',
        reference: ingredient.newMovement.reference
      };
  
      const updatedMovements = [...(ingredient.movements || []), newMovement];
      const totalMovements = updatedMovements.reduce((sum, mov) => sum + mov.quantity, 0);
      
      return {
        ...ingredient,
        movements: updatedMovements,
        finalStock: ingredient.initialStock + totalMovements,
        newMovement: { type: 'adjustment', quantity: 0, reference: '' }
      };
    };
  
    // Actualizar el estado usando la función separada
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(updateIngredient)
    }));
    
    setShowAddMovement(null);
  };

  const handleRemoveMovement = (ingredientId, movementIndex) => {
    setFormData(prev => {
      const ingredientToUpdate = prev.ingredients.find(ing => ing.ingredientId === ingredientId);
      if (!ingredientToUpdate) return prev; 
      const updatedMovements = [...ingredientToUpdate.movements];
      updatedMovements.splice(movementIndex, 1);
      const totalMovements = updatedMovements.reduce((sum, mov) => sum + mov.quantity, 0);
      const updatedIngredients = prev.ingredients.map(ing => 
        ing.ingredientId === ingredientId 
          ? {
              ...ing,
              movements: updatedMovements,
              finalStock: ing.initialStock + totalMovements
            }
          : ing
      );
      return {
        ...prev,
        ingredients: updatedIngredients
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedBranch) {
      setError('Por favor, seleccione una sucursal');
      return;
    }
  
    const branchName = typeof selectedBranch === 'string' 
      ? selectedBranch 
      : selectedBranch.nameBranch;
  
    try {
      setIsLoading(true);
      setError(null);
  
      const updateData = {
        nameBranch: branchName,
        ingredients: formData.ingredients.map(ing => ({
          ingredientId: ing.ingredientId,
          name: ing.name,
          initialStock: ing.initialStock,
          finalStock: ing.finalStock,
          movements: ing.movements
        })),
        observations: formData.observations
      };
  
      // Primero actualizamos el inventario
      const updateResponse = await updateBranchInventoryRequest(inventory._id, updateData);
      
      // Luego cerramos el inventario
      if (updateResponse?.data?.success) {
        await closeInventoryToBranchRequest({
          nameBranch: branchName,
          inventoryId: inventory._id
        });
        
        onSave({
          ...updateResponse.data.inventory,
          status: 'closed'
        });
      } else {
        throw new Error('Error al actualizar el inventario');
      }
  
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar los cambios. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMovementTypeChange = (ingredientId, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(i => 
        i.ingredientId === ingredientId 
          ? {...i, newMovement: {...i.newMovement, type: value}}
          : i
      )
    }));
  };
  
  const handleNewMovementQuantityChange = (ingredientId, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(i => 
        i.ingredientId === ingredientId 
          ? {...i, newMovement: {...i.newMovement, quantity: value}}
          : i
      )
    }));
  };
  
  const handleNewMovementReferenceChange = (ingredientId, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(i => 
        i.ingredientId === ingredientId 
          ? {...i, newMovement: {...i.newMovement, reference: value}}
          : i
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaBox className="text-gray-500" />
            <h3 className="text-lg font-medium">Inventario del Día</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ingrediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock Final
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Movimientos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.ingredients.map((ing) => (
                <>
                  <tr key={ing.ingredientId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ing.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ing.initialStock} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {ing.finalStock.toFixed(2)} kg
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {ing.movements.map((mov) => (
                          <div key={mov.id} className="flex items-center justify-between text-sm">
                            <span className={`${mov.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {mov.quantity} kg
                            </span>
                            <span className="text-gray-500 mx-2">-</span>
                            <span className="text-gray-600">{mov.reference}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMovement(ing.ingredientId, mov.id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAddMovement(ing.ingredientId)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FaPlus className="mr-2" size={12} />
                        Agregar Movimiento
                      </button>
                    </td>
                  </tr>
                  {showAddMovement === ing.ingredientId && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <select
                            value={ing.newMovement.type}
                            onChange={(e) => handleNewMovementTypeChange(ing.ingredientId, e.target.value)}
                            className="rounded-md border-gray-300"
                          >
                            <option value="loss">Pérdida</option>
                            <option value="adjustment">Ajuste</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Cantidad"
                            value={ing.newMovement.quantity}
                            onChange={(e) => handleNewMovementQuantityChange(ing.ingredientId, e.target.value)}
                            className="w-32 rounded-md border-gray-300"
                          />
                          <input
                            type="text"
                            placeholder="Referencia"
                            value={ing.newMovement.reference}
                            onChange={(e) => handleNewMovementReferenceChange(ing.ingredientId, e.target.value)}
                            className="flex-1 rounded-md border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddMovement(ing.ingredientId)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Agregar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observaciones */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block">
          <span className="text-gray-700">Observaciones Finales</span>
          <textarea
            value={formData.observations}
            onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            rows="3"
          />
        </label>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <FaSave />
          {isLoading ? 'Guardando...' : 'Verificar y Cerrar Inventario'}
        </button>
      </div>
    </form>
  );
};



EditInventory.propTypes = {
  inventory: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    ingredients: PropTypes.arrayOf(
      PropTypes.shape({
        ingredientId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        initialStock: PropTypes.number.isRequired,
        finalStock: PropTypes.number,
        movements: PropTypes.arrayOf(
          PropTypes.shape({
            date: PropTypes.instanceOf(Date),
            type: PropTypes.string.isRequired,
            ingredientId: PropTypes.string.isRequired,
            ingredientName: PropTypes.string.isRequired,
            quantity: PropTypes.number.isRequired,
            unit: PropTypes.string.isRequired,
            reference: PropTypes.string.isRequired
          })
        ),
        newMovement: PropTypes.shape({
          type: PropTypes.string.isRequired,
          quantity: PropTypes.number.isRequired,
          reference: PropTypes.string.isRequired
        }).isRequired
      })
    ).isRequired,
    observations: PropTypes.string
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};


export default EditInventory;