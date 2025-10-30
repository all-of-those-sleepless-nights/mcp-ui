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

import { CreateProBadgeDto } from './dto/create-pro-badge.dto';
import { CreateProDto } from './dto/create-pro.dto';
import { CreateProExtraDto } from './dto/create-pro-extra.dto';
import { CreateProTimeWindowDto } from './dto/create-pro-time-window.dto';
import { UpdateProBadgeDto } from './dto/update-pro-badge.dto';
import { UpdateProDto } from './dto/update-pro.dto';
import { UpdateProExtraDto } from './dto/update-pro-extra.dto';
import { UpdateProTimeWindowDto } from './dto/update-pro-time-window.dto';
import { ProsService } from './pros.service';

@Controller('pros')
export class ProsController {
  constructor(private readonly prosService: ProsService) {}

  @Post()
  create(@Body() dto: CreateProDto) {
    return this.prosService.create(dto);
  }

  @Get()
  findAll() {
    return this.prosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProDto,
  ) {
    return this.prosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prosService.remove(id);
  }

  @Post(':proId/time-windows')
  createTimeWindow(
    @Param('proId', ParseIntPipe) proId: number,
    @Body() dto: CreateProTimeWindowDto,
  ) {
    return this.prosService.addTimeWindow(proId, dto);
  }

  @Get(':proId/time-windows')
  listTimeWindows(@Param('proId', ParseIntPipe) proId: number) {
    return this.prosService.listTimeWindows(proId);
  }

  @Patch(':proId/time-windows/:timeWindowId')
  updateTimeWindow(
    @Param('proId', ParseIntPipe) proId: number,
    @Param('timeWindowId', ParseIntPipe) timeWindowId: number,
    @Body() dto: UpdateProTimeWindowDto,
  ) {
    return this.prosService.updateTimeWindow(proId, timeWindowId, dto);
  }

  @Delete(':proId/time-windows/:timeWindowId')
  removeTimeWindow(
    @Param('proId', ParseIntPipe) proId: number,
    @Param('timeWindowId', ParseIntPipe) timeWindowId: number,
  ) {
    return this.prosService.removeTimeWindow(proId, timeWindowId);
  }

  @Post(':proId/badges')
  createBadge(
    @Param('proId', ParseIntPipe) proId: number,
    @Body() dto: CreateProBadgeDto,
  ) {
    return this.prosService.addBadge(proId, dto);
  }

  @Get(':proId/badges')
  listBadges(@Param('proId', ParseIntPipe) proId: number) {
    return this.prosService.listBadges(proId);
  }

  @Patch(':proId/badges/:badgeId')
  updateBadge(
    @Param('proId', ParseIntPipe) proId: number,
    @Param('badgeId', ParseIntPipe) badgeId: number,
    @Body() dto: UpdateProBadgeDto,
  ) {
    return this.prosService.updateBadge(proId, badgeId, dto);
  }

  @Delete(':proId/badges/:badgeId')
  removeBadge(
    @Param('proId', ParseIntPipe) proId: number,
    @Param('badgeId', ParseIntPipe) badgeId: number,
  ) {
    return this.prosService.removeBadge(proId, badgeId);
  }

  @Post(':proId/extras')
  createExtra(
    @Param('proId', ParseIntPipe) proId: number,
    @Body() dto: CreateProExtraDto,
  ) {
    return this.prosService.addExtra(proId, dto);
  }

  @Get(':proId/extras')
  listExtras(@Param('proId', ParseIntPipe) proId: number) {
    return this.prosService.listExtras(proId);
  }

  @Patch(':proId/extras/:extraId')
  updateExtra(
    @Param('proId', ParseIntPipe) proId: number,
    @Param('extraId', ParseIntPipe) extraId: number,
    @Body() dto: UpdateProExtraDto,
  ) {
    return this.prosService.updateExtra(proId, extraId, dto);
  }

  @Delete(':proId/extras/:extraId')
  removeExtra(
    @Param('proId', ParseIntPipe) proId: number,
    @Param('extraId', ParseIntPipe) extraId: number,
  ) {
    return this.prosService.removeExtra(proId, extraId);
  }
}
