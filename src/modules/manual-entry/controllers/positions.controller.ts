import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PositionsService } from '../services/positions.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import {
  ListPositionsQueryDto,
  UpsertPositionDto,
  QuickCashUpdateDto,
  PositionsListResponseDto,
  UpsertPositionResponseDto,
  DeletePositionResponseDto,
} from '../dto/positions.dto';

@ApiTags('Positions')
@Controller('positions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all positions',
    description: 'Get all positions with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Positions retrieved successfully',
    type: PositionsListResponseDto,
  })
  async listPositions(
    @Query() query: ListPositionsQueryDto,
  ): Promise<PositionsListResponseDto> {
    return this.positionsService.listPositions(query);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update position',
    description: 'Upsert a position by asset and custodian',
  })
  @ApiResponse({
    status: 200,
    description: 'Position upserted successfully',
    type: UpsertPositionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async upsertPosition(
    @Body() dto: UpsertPositionDto,
  ): Promise<UpsertPositionResponseDto> {
    return this.positionsService.upsertPosition(dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete position',
    description: 'Delete a position by ID',
  })
  @ApiParam({ name: 'id', description: 'Position ID' })
  @ApiResponse({
    status: 200,
    description: 'Position deleted successfully',
    type: DeletePositionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Position not found' })
  async deletePosition(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeletePositionResponseDto> {
    return this.positionsService.deletePosition(id);
  }

  @Post('cash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick cash update',
    description: 'Shortcut to update cash position for a custodian',
  })
  @ApiResponse({
    status: 200,
    description: 'Cash position updated',
    type: UpsertPositionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async quickCashUpdate(
    @Body() dto: QuickCashUpdateDto,
  ): Promise<UpsertPositionResponseDto> {
    return this.positionsService.quickCashUpdate(dto);
  }
}
