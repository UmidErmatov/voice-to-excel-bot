import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InputFile, InlineKeyboard } from 'grammy';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BotService {}
