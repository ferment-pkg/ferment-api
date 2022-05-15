import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as child from 'child_process';
@Injectable()
export class BarrellsService {
  private barrells: Barrell[];
  async getBarrells(): Promise<Barrell[]> {
    if (!this.barrells) {
      this.barrells = [];
    }
    if (!fs.existsSync('Barrells')) {
      this.barrells = [];
      child.exec('git clone https://github.com/ferment-pkg/Barrells Barrells');
      //wait for done to be true
    } else {
      let done = false;
      const result = child
        .exec('git pull', { cwd: 'Barrells' })
        .on('exit', () => {
          done = true;
        });
      result.stdout.on('data', (data) => {
        if (!data.includes('Already up-to-date.')) {
          for (const file of fs.readdirSync('Barrells')) {
            if (!file.endsWith('.py') || file == 'index.py') {
              continue;
            }
            const name = file.replace('.py', '');
            const content = fs
              .readFileSync(`Barrells/${file}`, 'utf8')
              .split('\n');
            const description = content
              .find((line) => line.includes('description'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll('"', '') as string;
            const download = content
              .find((line) => line.includes('url'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll("'", '')
              .replaceAll('"', '') as string;
            const git =
              content.find((line) => line.includes('git'))?.split('=')[1] ==
              'True';
            const dependencies = content
              .find((line) => line.includes('dependencies'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll('[', '')
              .replaceAll(']', '')
              .replaceAll(' ', '')
              .replaceAll("'", '')
              .replaceAll('"', '') as string;
            const home = content
              .find((line) => line.includes('homepage'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll('"', '') as string;
            this.barrells.push({
              name,
              description,
              download,
              git,
              dependencies: dependencies ? dependencies.split(',') : undefined,
              home,
            });
          }
        }
      });
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    if (this.barrells.length == 0) {
      for (const file of fs.readdirSync('Barrells')) {
        if (!file.endsWith('.py') || file == 'index.py') {
          continue;
        }
        const name = file.replace('.py', '');
        const content = fs.readFileSync(`Barrells/${file}`, 'utf8').split('\n');
        const description = content
          .find((line) => line.includes('description'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('"', '') as string;
        const download = content
          .find((line) => line.includes('url'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll("'", '')
          .replaceAll('"', '') as string;
        const git =
          content.find((line) => line.includes('git'))?.split('=')[1] == 'True';
        const dependencies = content
          .find((line) => line.includes('dependencies'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('[', '')
          .replaceAll(']', '')
          .replaceAll(' ', '')
          .replaceAll("'", '')
          .replaceAll('"', '') as string;
        const home = content
          .find((line) => line.includes('homepage'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('"', '') as string;
        this.barrells.push({
          name,
          description,
          download,
          git,
          dependencies: dependencies ? dependencies.split(',') : undefined,
          home,
        });
      }
    }
    return this.barrells || [];
  }
}
