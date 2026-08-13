const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const crops = [
  {id:'rice', name:'Rice', icon:'🌾', score:94, soil:'Alluvial / clay loam', water:'High', seasons:'Kharif', window:'June–July', reason:'Strong fit for eastern India monsoon conditions when water is available.'},
  {id:'maize', name:'Maize', icon:'🌽', score:88, soil:'Alluvial / loam', water:'Medium', seasons:'Kharif / Rabi', window:'June–July or Oct–Nov', reason:'Good fit where drainage is adequate and irrigation can be managed.'},
  {id:'soybean', name:'Soybean', icon:'🌱', score:86, soil:'Well-drained loam', water:'Medium', seasons:'Kharif', window:'June–July', reason:'Suitable for well-drained fields with moderate moisture.'},
  {id:'groundnut', name:'Groundnut', icon:'🥜', score:82, soil:'Sandy loam / loam', water:'Medium', seasons:'Kharif / Rabi', window:'June–July or Jan–Feb', reason:'Prefers loose, well-drained soil and controlled irrigation.'},
  {id:'mustard', name:'Mustard', icon:'🌼', score:79, soil:'Loam / alluvial', water:'Low–Medium', seasons:'Rabi', window:'Oct–Nov', reason:'A practical winter option where temperatures are suitable.'},
  {id:'potato', name:'Potato', icon:'🥔', score:77, soil:'Sandy loam / loam', water:'Medium', seasons:'Rabi', window:'Oct–Nov', reason:'Works well in cool, well-drained soil with regular moisture.'}
];

app.get('/api/dashboard', (req,res)=>res.json({
  soil:{moisture:32, ph:6.7, temperature:29, type:'Alluvial'},
  plantHealth:88,
  topCrop:crops[0],
  irrigation:{status:'WAIT', reason:'Soil moisture is adequate; check the latest forecast before irrigating.', litres:35},
  alerts:['Rain may affect irrigation timing.','Plant growth is currently on track.'],
  moistureTrend:[29,31,35,33,37,34,32]
}));

app.get('/api/soil/analyze',(req,res)=>res.json({
  profile:{type:'Alluvial',ph:6.7,moisture:32,temperature:29},
  summary:'Sensor-ready soil profile detected. Current demo values indicate mildly acidic-to-neutral, moderately moist soil.',
  sensor:'Demo sensor feed — soil type will be auto-detected when the hardware module is connected.'
}));

app.get('/api/crop/recommend',(req,res)=>{
  const month = new Date().getMonth()+1;
  const season = [6,7,8,9].includes(month)?'Kharif':([10,11,12,1,2].includes(month)?'Rabi':'Transition');
  const ranked = crops.map(c=>({...c, seasonalBoost:(c.seasons.includes(season)?4:0), bestTime:c.window})).sort((a,b)=>(b.score+b.seasonalBoost)-(a.score+a.seasonalBoost));
  res.json({season,month,recommendations:ranked.slice(0,4), note:'Planting windows are demo guidance for the hackathon; final sowing decisions should use local agronomy, variety, rainfall and field conditions.'});
});

app.get('/api/irrigation/recommend',(req,res)=>res.json({status:'WAIT',litres:35,confidence:84,reason:'Moisture is currently adequate. Re-check after rainfall and use the crop stage plus sensor readings before irrigation.'}));
app.get('/api/plant/analyze',(req,res)=>res.json({health:88,growth:'On track',signals:['Leaf colour looks healthy in demo input','No major stress signal detected','Continue monitoring after weather changes'],next:'Capture another image in 3–5 days for trend comparison.'}));

app.get('/api/weather', async (req,res)=>{
  const lat = Number(req.query.lat || 22.5726);
  const lon = Number(req.query.lon || 88.3639);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code&forecast_days=5&timezone=auto`;
    const r = await fetch(url);
    if(!r.ok) throw new Error('Weather service unavailable');
    const data = await r.json();
    res.json({source:'Open-Meteo',latitude:lat,longitude:lon,current:data.current,daily:data.daily});
  } catch(e){
    res.status(502).json({error:'Unable to fetch live weather right now. Please retry.',detail:e.message});
  }
});

app.get('/api/reports',(req,res)=>res.json({generatedAt:new Date().toISOString(),summary:'GreenByte demo farm report',metrics:{moisture:32,ph:6.7,plantHealth:88,topCrop:'Rice'}}));
app.post('/api/settings',(req,res)=>res.json({ok:true,settings:req.body}));

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

// Vercel imports this Express app as a serverless function.
// Local development still uses: npm start
if (require.main === module) {
  app.listen(PORT,()=>console.log(`GreenByte server running at http://localhost:${PORT}`));
}

module.exports = app;
