const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth');
const { createRateLimiter } = require('../../middlewares/rateLimit');
const Push = require('../../services/pushNotifications.service');
const limit = createRateLimiter({windowMs:60*1000,max:60,testMax:1000,message:'Muitas requisições de notificações.'});

router.post('/register', authenticateToken, limit, (req,res) => {
  try {
    if (!['CUSTOMER','OWNER'].includes(req.user.role_code)) return res.status(403).json({error:'Somente o cliente pode cadastrar o aparelho.'});
    Push.register(req.user.id, req.body?.token);
    res.json({success:true, registered:true});
  } catch (error) { res.status(400).json({success:false,error:error.message}); }
});
router.post('/ack', limit, (req,res) => {
  const { delivery_id, ack_secret, action } = req.body || {};
  if (!/^push_[0-9a-f]{20}$/.test(String(delivery_id||'')) || !/^[0-9a-f]{48}$/.test(String(ack_secret||''))) {
    return res.status(400).json({success:false,error:'Confirmação inválida.'});
  }
  if (!Push.acknowledge(delivery_id,ack_secret,action==='OPENED'?'OPENED':'RECEIVED')) return res.status(404).json({success:false,error:'Mensagem não encontrada.'});
  res.json({success:true, status:action==='OPENED'?'OPENED':'RECEIVED'});
});
module.exports = router;
