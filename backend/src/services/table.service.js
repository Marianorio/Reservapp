const tableRepository = require('../repositories/table.repository');

const tableService = {
  async getAll() {
    return tableRepository.findAll();
  },

  async getById(id) {
    return tableRepository.findById(id);
  },
};

module.exports = tableService;
