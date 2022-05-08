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
    if (!fs.existsSync('ferment')) {
      this.barrells = [];
      let done = false;
      child
        .exec('git clone https://github.com/ferment-pkg/ferment ferment')
        .on('close', () => {
          fs.rmSync('ferment/cmd', { recursive: true });
          fs.rmSync('ferment/images', { recursive: true });
          fs.rmSync('ferment/bin', { recursive: true });
          fs.rmSync('ferment/main.go', { recursive: true });
          fs.rmSync('ferment/go.mod', { recursive: true });
          fs.rmSync('ferment/go.sum', { recursive: true });
          done = true;
          console.log(done);
        });
      //wait for done to be true
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } else {
      let done = false;
      child.exec('git pull', { cwd: 'ferment' }).on('exit', () => {
        done = true;
      });
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    for (const file of fs.readdirSync('ferment/Barrells')) {
      if (!file.endsWith('.py') || file == 'index.py') {
        continue;
      }
      const name = file.replace('.py', '');
      const content = fs
        .readFileSync(`ferment/Barrells/${file}`, 'utf8')
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
    return this.barrells || [];
  }
}
