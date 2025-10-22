const { createError } = require('../utils/errors');
const logger = require('../utils/logger');

// Base controller class that provides common CRUD operations
class BaseController {
  constructor(model, entityName) {
    this.model = model;
    this.entityName = entityName;
  }

  // Get all entities
  getAllEntities = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sortBy = 'id', order = 'asc', ...filters } = req.query;
      
      const entities = await this.model.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        order,
        filters
      });
      
      res.status(200).json({
        success: true,
        count: entities.length,
        data: entities
      });
    } catch (error) {
      logger.error(`Error in getAllEntities for ${this.entityName}:`, error);
      next(error);
    }
  };

  // Get entity by ID
  getEntityById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const entity = await this.model.findById(id);
      
      if (!entity) {
        return next(createError('NOT_FOUND', `${this.entityName} not found`));
      }
      
      res.status(200).json({
        success: true,
        data: entity
      });
    } catch (error) {
      logger.error(`Error in getEntityById for ${this.entityName}:`, error);
      next(error);
    }
  };

  // Create new entity
  createEntity = async (req, res, next) => {
    try {
      const newEntity = await this.model.create(req.body);
      
      res.status(201).json({
        success: true,
        message: `${this.entityName} created successfully`,
        data: newEntity
      });
    } catch (error) {
      logger.error(`Error in createEntity for ${this.entityName}:`, error);
      next(error);
    }
  };

  // Update entity
  updateEntity = async (req, res, next) => {
    try {
      const { id } = req.params;
      const entity = await this.model.findById(id);
      
      if (!entity) {
        return next(createError('NOT_FOUND', `${this.entityName} not found`));
      }
      
      const updatedEntity = await this.model.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: `${this.entityName} updated successfully`,
        data: updatedEntity
      });
    } catch (error) {
      logger.error(`Error in updateEntity for ${this.entityName}:`, error);
      next(error);
    }
  };

  // Delete entity
  deleteEntity = async (req, res, next) => {
    try {
      const { id } = req.params;
      const entity = await this.model.findById(id);
      
      if (!entity) {
        return next(createError('NOT_FOUND', `${this.entityName} not found`));
      }
      
      await this.model.delete(id);
      
      res.status(200).json({
        success: true,
        message: `${this.entityName} deleted successfully`
      });
    } catch (error) {
      logger.error(`Error in deleteEntity for ${this.entityName}:`, error);
      next(error);
    }
  };
}

module.exports = BaseController;