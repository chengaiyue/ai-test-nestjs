import { killPort } from '@nx/node/utils';
 

module.exports = async function() {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  // admin 应用默认端口为 3001（与 global-setup / test-setup 保持一致）
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await killPort(port);
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
