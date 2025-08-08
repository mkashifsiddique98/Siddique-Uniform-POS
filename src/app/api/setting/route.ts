import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

type Data = {
    message?: string;
    error?: string;
};

const PROJECT_DIR = path.join(process.cwd(), '');
const execPromise = util.promisify(exec);

export async function POST(req: NextApiRequest, res: NextApiResponse<Data>) {
    try {
        const gitPullCommand = 'git pull origin main';
        const npmInstallCommand = 'npm install';
        const npmBuildCommand = 'npm run build';
        const npmStartCommand = 'npm start';

        console.log("Running:", gitPullCommand);
        const gitPull = await execPromise(gitPullCommand, { cwd: PROJECT_DIR });
        console.log(`git pull stdout: ${gitPull.stdout}`);
        console.error(`git pull stderr: ${gitPull.stderr}`);

        console.log("Running:", npmInstallCommand);
        const npmInstall = await execPromise(npmInstallCommand, { cwd: PROJECT_DIR });
        console.log(`npm install stdout: ${npmInstall.stdout}`);
        console.error(`npm install stderr: ${npmInstall.stderr}`);

        console.log("Running:", npmBuildCommand);
        const npmBuild = await execPromise(npmBuildCommand, { cwd: PROJECT_DIR });
        console.log(`npm run build stdout: ${npmBuild.stdout}`);
        console.error(`npm run build stderr: ${npmBuild.stderr}`);

        // Start the application
        console.log("Running:", npmStartCommand);
        const npmStart = await execPromise(npmStartCommand, { cwd: PROJECT_DIR });
        console.log(`npm start stdout: ${npmStart.stdout}`);
        console.error(`npm start stderr: ${npmStart.stderr}`);

        return res.status(200).json({ message: 'Update complete' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'An error occurred' });
    }
}
