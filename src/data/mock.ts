import type { Prebooking } from '../types';
import dayjs from 'dayjs';

const dealers = ['Dealer A','Dealer B','Dealer C','Dealer D','Dealer E','Dealer F','Dealer G','Dealer H','Dealer I'];
const extColors = ['Snowflake White Pearl','Machine Gray','Polymetal Gray','Jet Black','Platinum Quartz','Soul Red Crystal'];
const intColors = ['Black','Tan'];
const model = ['1','2'];
const pkgs = ['A','B','None'] as const;

function rand<T>(arr:T[]){ return arr[Math.floor(Math.random()*arr.length)] }

export const mockData: Prebooking[] = Array.from({length: 235}, (_,i)=>{
  const monthOffset = Math.floor(Math.random()*3); // 0..2
  const date = dayjs('2025-11-01').add(monthOffset,'month').add(Math.floor(Math.random()*28),'day').hour(10+Math.floor(Math.random()*10));
  return {
    bookingAt: date.toISOString(),
    bookingNo: String(220000 + i),
    mazdaId: 'XXXXX',
    firstName: 'กานดา',
    lastName: 'ใจ'+String(10000+i),
    dealer: rand(dealers),
    exteriorColor: rand(extColors),
    interiorColor: rand(intColors),
    model: rand(model),
    package: rand(pkgs)
  };
});
