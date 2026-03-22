import 'dotenv/config';
import { env } from './config/env';
import app from './app';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
