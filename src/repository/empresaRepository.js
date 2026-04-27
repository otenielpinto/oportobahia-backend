//Classe tem letras maiuculoas

import { Repository } from "./baseRepository.js";

class EmpresaRepository extends Repository {
  constructor(id_tenant = null) {
    super("empresa", id_tenant);
  }

  // Métodos personalizados específicos para Empresa podem ser adicionados aqui
  // Os métodos básicos (create, update, delete, findAll, findById, etc.)
  // já estão disponíveis através da herança da Repository

  async findByCnpjCpf(cpfcnpj) {
    return await this.findOne({ cpfcnpj: cpfcnpj });
  }

  async findByRazaoSocial(razao_social) {
    return await this.findOne({ razao_social: razao_social });
  }

  async findActiveEmpresas() {
    return await this.findAll({ ativo: true });
  }
}

export { EmpresaRepository };
