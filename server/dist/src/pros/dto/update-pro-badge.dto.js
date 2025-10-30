"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProBadgeDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_pro_badge_dto_1 = require("./create-pro-badge.dto");
class UpdateProBadgeDto extends (0, mapped_types_1.PartialType)(create_pro_badge_dto_1.CreateProBadgeDto) {
}
exports.UpdateProBadgeDto = UpdateProBadgeDto;
//# sourceMappingURL=update-pro-badge.dto.js.map