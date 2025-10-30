"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProExtraDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_pro_extra_dto_1 = require("./create-pro-extra.dto");
class UpdateProExtraDto extends (0, mapped_types_1.PartialType)(create_pro_extra_dto_1.CreateProExtraDto) {
}
exports.UpdateProExtraDto = UpdateProExtraDto;
//# sourceMappingURL=update-pro-extra.dto.js.map