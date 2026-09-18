import {test,expect} from '@playwright/test';

test('урок → задачи → разбор → перезагрузка → повторение ошибок → офлайн',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.E2E_PATH || '/');await expect(page.getByRole('heading',{name:'Маленькая практика.' ,exact:false})).toBeVisible();
 await page.screenshot({path:'test-results/home-mobile.png',fullPage:false});
 await page.getByRole('button',{name:'Начать урок',exact:true}).click();
 for(const a of ['Король','Десятка','Пятёрка']){await page.getByRole('button',{name:a,exact:true}).click();if(a!=='Пятёрка')await page.getByRole('button',{name:'Продолжить',exact:true}).click();}
 await page.getByRole('button',{name:'Перейти к практике'}).click();
 await expect(page.getByRole('heading',{name:'Старшинство карт'})).toBeVisible();
 for(let i=0;i<5;i++){
  const displayed=await page.locator('.table .card').allTextContents();
  const rank=(v:string)=>'23456789TJQKA'.indexOf(v.startsWith('10')?'T':v[0]);
  const x=rank(displayed[0]),y=rank(displayed[1]);const correct=x===y?'Равны':x>y?'Левая':'Правая';const answer=i===0?(correct==='Левая'?'Правая':'Левая'):correct;
  await page.getByRole('button',{name:answer,exact:true}).click();await page.getByRole('button',{name:'Проверить ответ'}).click();await expect(page.getByRole('status')).toContainText(i===0?'Ошибка':'Верно');
  if(i===0)await page.screenshot({path:'test-results/review-mobile.png',fullPage:true});
  await page.getByRole('button',{name:i===4?'Завершить тренировку':'Следующая задача'}).click();
 }
 await expect(page.locator('.big-result')).toContainText('4 / 5');
 await page.reload();await page.getByRole('button',{name:'Мой прогресс',exact:true}).click();await expect(page.locator('.stats')).toContainText('5');
 await expect(page.locator('.progress-card')).toContainText('1/9');
 await page.getByRole('button',{name:'Повторить ошибки · 1'}).click();await expect(page.getByRole('heading',{name:'Старшинство карт'})).toBeVisible();
 const repeated=await page.locator('.table .card').allTextContents();const rank=(v:string)=>'23456789TJQKA'.indexOf(v.startsWith('10')?'T':v[0]);const a=rank(repeated[0]),b=rank(repeated[1]);
 await page.getByRole('button',{name:a===b?'Равны':a>b?'Левая':'Правая',exact:true}).click();await page.getByRole('button',{name:'Проверить ответ'}).click();await expect(page.getByRole('status')).toContainText('Верно');await page.getByRole('button',{name:'Завершить тренировку'}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('river.progress.v1')!).mistakes.length)).toBe(0);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload();await expect(page.getByText('Без интернета · прогресс на устройстве')).toBeVisible();
 await page.getByRole('button',{name:'Тренажёры',exact:true}).click();await page.getByRole('button',{name:/Оцени эквити Конкретная/}).click();
 await expect(page.getByRole('heading',{name:'Оцени эквити'})).toBeVisible();await page.locator('.choices button').first().click();await page.getByRole('button',{name:'Проверить ответ'}).click();await expect(page.getByRole('status')).toContainText('Точное эквити');
 expect(errors).toEqual([]);
});

test('матрица доступна через крупный селектор, узкий экран без горизонтальной прокрутки',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.goto(process.env.E2E_PATH || '/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Тренажёры',exact:true}).click();await page.getByRole('button',{name:/Матрица стартовых рук/}).click();
 await page.getByLabel('Выбрать руку крупным списком').selectOption('AKs');await expect(page.locator('.cell-description')).toContainText('AKs');
 await page.getByRole('button',{name:'Добавить в набор'}).click();await expect(page.getByRole('button',{name:'AKs',exact:true})).toHaveClass(/marked/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/matrix-320.png',fullPage:true});
});

test('лучшая пятёрка: выбор карт и понятный разбор',async({page})=>{
 await page.goto(process.env.E2E_PATH || '/');await page.getByRole('button',{name:'Тренажёры',exact:true}).click();await page.getByRole('button',{name:/03 Лучшая пятёрка/}).click();
 for(let i=0;i<5;i++)await page.locator('.select-cards button').nth(i).click();
 await expect(page.getByText('Выбрано 5 из 5.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Проверить ответ'}).click();await expect(page.getByRole('status')).toContainText('Лучшая комбинация');
});

test('повреждённое сохранение не перезаписывается, корректный импорт восстанавливает запись',async({page})=>{
 await page.goto(process.env.E2E_PATH || '/');await page.evaluate(()=>localStorage.setItem('river.progress.v1','damaged-json'));await page.reload();await expect(page.getByRole('alert')).toContainText('Не удалось прочитать');
 expect(await page.evaluate(()=>localStorage.getItem('river.progress.v1'))).toBe('damaged-json');
 await page.getByRole('button',{name:'Настройки и установка'}).click();
 const restored={version:1,lessons:['cards'],attempts:[],mistakes:[],format:'tournament',days:[]};
 await page.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(restored))});
 await expect(page.getByRole('status')).toContainText('Резервная копия восстановлена');await expect(page.getByRole('alert')).toHaveCount(0);await page.reload();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('river.progress.v1')!).lessons)).toEqual(['cards']);
});
