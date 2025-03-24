// controllers/employees.branch.controller.js
import Employee from '../models/employees.model.js';
import Branch from '../models/branch.model.js';
import bcrypt from 'bcrypt';


// Registrar un nuevo empleado en una sucursal
// Obtener empleados con filtros
export const obtenerEmpleadosConFiltros = async (requisito, res) => {
    const { nombreDeLaRama, estadoDelContrato, role } = requisito.consulta;
    const salarioMin = requisito.consulta['rango salarial[min]'];
    const salarioMaximo = requisito.consulta['rangosalario[máximo]'];
    const hoy = new Date();
    const condicionesDeFiltro = {};
  
    try {
      // Filtro por sucursal
      if (nombreDeLaRama) {
        const resultado = await aplicarFiltroSucursal(nombreDeLaRama, res);
        if (!resultado.exito) return resultado.respuesta;
        condicionesDeFiltro._id = resultado.condicion;
      }
  
      // Filtro por salario
      aplicarFiltroSalario(condicionesDeFiltro, salarioMin, salarioMaximo);
  
      // Filtro por estado de contrato
      aplicarFiltroContrato(condicionesDeFiltro, estadoDelContrato, hoy);
  
      // Filtro por rol
      aplicarFiltroRol(condicionesDeFiltro, role);
  
      // Obtener empleados con filtros
      const empleados = await Empleado.find(condicionesDeFiltro);
  
      return res.status(200).json({
        exito: true,
        mensaje: 'Empleados obtenidos con filtros aplicados',
        empleados,
      });
  
    } catch (error) {
      console.error('Error al obtener empleados con filtros:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener empleados con filtros',
        error: error.message,
      });
    }
  };

async function aplicarFiltroSucursal(nombreRama, res) {
    const rama = await Rama.findOne({ nombreRama: nombreRama.toLowerCase() });
    if (!rama) {
        return {
        exito: false,
        respuesta: res.status(404).json({ exito: false, mensaje: 'Sucursal no encontrada' })
        };
    }
    return {
        exito: true,
        condicion: { $in: rama.empleados }
    };
}

function aplicarFiltroSalario(condiciones, min, max) {
    if (min || max) {
      condiciones.salario = {};
      if (min) condiciones.salario.$gte = Number(min);
      if (max) condiciones.salario.$lte = Number(max);
    }
}
  
function aplicarFiltroContrato(condiciones, estado, fecha) {
    if (estado && estado !== 'todo') {
        condiciones.contractEnd = estado === 'activo' ? { $gte: fecha } : { $lt: fecha };
    }
}
  
function aplicarFiltroRol(condiciones, rol) {
    if (rol && rol !== 'todo') {
        condiciones.rol = rol;
    }
}
  
// Obtener empleados en una sucursal específica
export const getEmployeesByBranch = async (req, res) => {
    const { branchName } = req.params;

    try {
        const branch = await Branch.findOne({ nameBranch: branchName.toLowerCase() }).populate('employees');
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Sucursal no encontrada' });
        }

        res.status(200).json({
            success: true,
            message: `Empleados obtenidos exitosamente en la sucursal ${branch.nameBranch}`,
            employees: branch.employees,
        });
    } catch (error) {
        console.error("Error al obtener empleados por sucursal:", error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleados de la sucursal',
            error: error.message,
        });
    }
};

// Obtener empleado por ID
export const getEmployeeById = async (req, res) => {
    const { id } = req.params;

    try {
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        res.status(200).json({
            success: true,
            employee,
        });
    } catch (error) {
        console.error("Error al obtener empleado por ID:", error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleado por ID',
            error: error.message,
        });
    }
};

// Función auxiliar para aplicar filtro de sucursal
const applyBranchFilter = async (branchName) => {
    if (!branchName) return null;
    
    const branch = await Branch.findOne({ nameBranch: branchName.toLowerCase() });
    if (!branch) return false;
    
    return { _id: { $in: branch.employees } };
};

// Función auxiliar para aplicar filtro de salario
const applySalaryFilter = (salaryMin, salaryMax) => {
    if (!salaryMin && !salaryMax) return null;
    
    const salaryFilter = {};
    if (salaryMin) salaryFilter.$gte = Number(salaryMin);
    if (salaryMax) salaryFilter.$lte = Number(salaryMax);
    
    return { salary: salaryFilter };
};

// Obtener empleados con filtros
export const getEmployeesWithFilters = async (req, res) => {
    try {
        const filterConditions = await buildFilterConditions(req.query);
        const employees = await Employee.find(filterConditions);

        return res.status(200).json({
            success: true,
            message: 'Empleados obtenidos con filtros aplicados',
            employees,
        });
    } catch (error) {
        console.error("Error al obtener empleados con filtros:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error interno del servidor',
        });
    }
};

// Función auxiliar para construir los filtros
const buildFilterConditions = async (query) => {
    const { branchName, contractStatus, role } = query;
    const salaryMin = query['salaryRange[min]'];
    const salaryMax = query['salaryRange[max]'];
    const today = new Date();
    const filterConditions = {};

    // Aplicar filtro de sucursal
    const branchFilter = await applyBranchFilter(branchName);
    if (branchFilter === false) {
        const error = new Error('Sucursal no encontrada');
        error.statusCode = 404;
        throw error;
    }
    Object.assign(filterConditions, branchFilter || {});

    // Aplicar filtro de salario
    Object.assign(filterConditions, applySalaryFilter(salaryMin, salaryMax) || {});

    // Filtro por estado de contrato
    if (contractStatus && contractStatus !== 'all') {
        filterConditions.contractEnd = contractStatus === 'active'
            ? { $gte: today }
            : { $lt: today };
    }

    // Filtro por rol
    if (role && role !== 'all') {
        filterConditions.role = role;
    }

    return filterConditions;
};


// Controlador para editar un empleado en una sucursal
export const editEmployeeInBranch = async (req, res) => {
    const { id } = req.params; // ID del empleado a editar
    const { name, ci, phone, email, contractStart, contractEnd, salary, role } = req.body;
    const photo = req.file ? req.file.filename : null; // Nueva foto si se sube

    try {
        // Verificar si el empleado existe
        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            { name, ci, phone, email, contractStart, contractEnd, salary, role, ...(photo && { photo }) },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Empleado actualizado exitosamente',
            employee: updatedEmployee,
        });
    } catch (error) {
        console.error("Error al actualizar empleado:", error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el empleado',
            error: error.message,
        });
    }
};

// Controlador para eliminar un empleado de una sucursal
export const deleteEmployeeFromBranch = async (req, res) => {
    const { id } = req.params; // ID del empleado a eliminar

    try {
        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        // También elimina el empleado de la lista de empleados en la sucursal
        await Branch.updateOne(
            { employees: id },
            { $pull: { employees: id } }
        );

        res.status(200).json({
            success: true,
            message: 'Empleado eliminado exitosamente',
        });
    } catch (error) {
        console.error("Error al eliminar empleado:", error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el empleado',
            error: error.message,
        });
    }
};