import 'dotenv/config';
import { env } from './config/env';
import app from './app';
import { logger } from './config/logger';

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server is running');
});
