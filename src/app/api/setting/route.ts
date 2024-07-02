
import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

type Data = {
    message?: string;
    error?: string;
};

export default async function POST(req: NextApiRequest, res: NextApiResponse<Data>) {
    try {
        exec('git pull && npm build && npm run dev', (error, stdout, stderr) => {
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
