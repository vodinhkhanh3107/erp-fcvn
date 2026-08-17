import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base/base.service';
import { XxxEntity } from './entities/xxx.entity';

@Injectable()
export class XxxService extends BaseService<XxxEntity> {
  constructor(
    @InjectRepository(XxxEntity)
    repo: Repository<XxxEntity>,
  ) {
    super(repo, ['name']);
  }

}
