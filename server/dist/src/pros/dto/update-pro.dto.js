"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_pro_dto_1 = require("./create-pro.dto");
class UpdateProDto extends (0, mapped_types_1.PartialType)(create_pro_dto_1.CreateProDto) {
}
exports.UpdateProDto = UpdateProDto;
//# sourceMappingURL=update-pro.dto.js.map