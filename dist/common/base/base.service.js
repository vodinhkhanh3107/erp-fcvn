"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
class BaseService {
    constructor(repository, searchableFields = []) {
        this.repository = repository;
        this.searchableFields = searchableFields;
    }
    async findAll(query) {
        const { page, limit, keyword } = query;
        const where = keyword && this.searchableFields.length > 0
            ? this.searchableFields.map((field) => ({ [field]: (0, typeorm_1.ILike)(`%${keyword}%`) }))
            : [];
        const order = { id: 'DESC' };
        const [items, total] = await this.repository.findAndCount({
            where: where.length ? where : undefined,
            order,
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async findOne(id) {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) {
            throw new common_1.NotFoundException('item-not-found');
        }
        return entity;
    }
    async create(dto) {
        const entity = this.repository.create(dto);
        return this.repository.save(entity);
    }
    async update(id, dto) {
        const entity = await this.findOne(id);
        Object.assign(entity, dto);
        return this.repository.save(entity);
    }
    async remove(id) {
        await this.findOne(id);
        await this.repository.softDelete(id);
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=base.service.js.map