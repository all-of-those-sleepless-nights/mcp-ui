import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateServiceDto } from './dto/create-service.dto';
import { CreateServiceExtraDto } from './dto/create-service-extra.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceExtraDto } from './dto/update-service-extra.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }

  @Post(':serviceId/extras')
  createExtra(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body() dto: CreateServiceExtraDto,
  ) {
    return this.servicesService.addExtra(serviceId, dto);
  }

  @Get(':serviceId/extras')
  listExtras(@Param('serviceId', ParseIntPipe) serviceId: number) {
    return this.servicesService.listExtras(serviceId);
  }

  @Patch(':serviceId/extras/:extraId')
  updateExtra(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('extraId', ParseIntPipe) extraId: number,
    @Body() dto: UpdateServiceExtraDto,
  ) {
    return this.servicesService.updateExtra(serviceId, extraId, dto);
  }

  @Delete(':serviceId/extras/:extraId')
  removeExtra(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('extraId', ParseIntPipe) extraId: number,
  ) {
    return this.servicesService.removeExtra(serviceId, extraId);
  }
}
