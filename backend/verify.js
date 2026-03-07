import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import winston from 'winston';
import playwright from 'playwright';
import nodeCron from 'node-cron';
import admZip from 'adm-zip';
import fsExtra from 'fs-extra';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import joi from 'joi';
import axios from 'axios';

console.log('✅ Base dependencies loaded');

import connectDB from './src/config/database.js';
console.log('✅ connectDB imported');

import errorHandler from './src/middlewares/errorMiddleware.js';
console.log('✅ errorHandler imported');

import logger from './src/utils/logger.js';
console.log('✅ logger imported');

import contratistaRoutes from './src/routes/contratistaRoutes.js';
console.log('✅ contratistaRoutes imported');

import supervisorRoutes from './src/routes/supervisorRoutes.js';
console.log('✅ supervisorRoutes imported');

import automationRoutes from './src/routes/automationRoutes.js';
console.log('✅ automationRoutes imported');

import { setupCronJobs } from './src/utils/cronJob.js';
console.log('✅ setupCronJobs imported');

console.log('🚀 All imports successful!');
