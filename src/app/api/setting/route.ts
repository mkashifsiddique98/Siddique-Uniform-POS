
import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';

type Data = {
    message?: string;
    error?: string;
};
const PROJECT_DIR = path.join(process.cwd(), 'path-to-your-cloned-repo');

export default async function POST(req: NextApiRequest, res: NextApiResponse<Data>) {
    try {
        const command = `
            cd ${PROJECT_DIR} &&
            git pull origin main &&
            npm install &&
            npm run build &&
            npm run dev
        `;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.status(200).json({ message: 'Update complete' });
        });
    } catch (error:any) {
        res.status(405).json(error);
    }
   
}
