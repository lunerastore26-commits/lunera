const {onCall,onRequest,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const Razorpay=require("razorpay");
const crypto=require("crypto");

initializeApp();
const db=getFirestore();
const RAZORPAY_KEY_ID=defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET=defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET=defineSecret("RAZORPAY_WEBHOOK_SECRET");
const REGION="asia-south1";
const ADMIN_EMAIL="lunerastore26@gmail.com";

function razorpayClient(){return new Razorpay({key_id:RAZORPAY_KEY_ID.value(),key_secret:RAZORPAY_KEY_SECRET.value()});}
function clean(v,max=500){return String(v??"").trim().slice(0,max);}
function moneyNumber(v){const n=Number(String(v??"0").replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
function requireUser(req){if(!req.auth||!req.auth.uid)throw new HttpsError("unauthenticated","Please sign in before checkout.");return req.auth;}
function validCustomer(c){
 const customer={name:clean(c?.name,120),phone:clean(c?.phone,10).replace(/\\D/g,""),email:clean(c?.email,254),address:clean(c?.address,500),city:clean(c?.city,100),state:clean(c?.state,100),pin:clean(c?.pin,6).replace(/\\D/g,""),notes:clean(c?.notes,1000)};
 if(!customer.name||!/^[0-9]{10}$/.test(customer.phone)||!customer.address||!customer.city||!customer.state||!/^[0-9]{6}$/.test(customer.pin))throw new HttpsError("invalid-argument","Please check your delivery details.");
 if(customer.email&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(customer.email))throw new HttpsError("invalid-argument","Please enter a valid email address.");
 return customer;
}
async function validatedItems(input){
 if(!Array.isArray(input)||input.length<1||input.length>50)throw new HttpsError("invalid-argument","Your bag is empty or invalid.");
 const snap=await db.collection("site").doc("catalogue").get();
 if(!snap.exists)throw new HttpsError("failed-precondition","LUNÉRA catalogue is not published.");
 const products=Array.isArray(snap.data().luneraProducts)?snap.data().luneraProducts:[];
 const items=input.map(raw=>{
  const p=products.find(x=>x&&String(x.id)===String(raw.id));
  if(!p)throw new HttpsError("failed-precondition","A selected product is no longer available.");
  const price=moneyNumber(p.price),quantity=Number(raw.quantity),sizes=Array.isArray(p.sizes)?p.sizes.map(String):String(p.sizes||"Standard").split(",").map(s=>s.trim()).filter(Boolean),size=clean(raw.size,50);
  if(!Number.isFinite(price)||price<=0||price>10000000)throw new HttpsError("failed-precondition","A product has an invalid price.");
  if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw new HttpsError("invalid-argument","Product quantity is invalid.");
  if(!sizes.includes(size))throw new HttpsError("failed-precondition","A selected size is no longer available.");
  return {id:p.id,name:clean(p.name,200),price,category:clean(p.category,100),image:clean(p.image,2000),size,quantity};
 });
 const total=items.reduce((sum,i)=>sum+i.price*i.quantity,0);
 if(!Number.isSafeInteger(Math.round(total*100))||total<=0||total>10000000)throw new HttpsError("invalid-argument","Order total is invalid.");
 return {items,total};
}
exports.createRazorpayOrder=onCall({region:REGION,secrets:[RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET]},async req=>{
 const user=requireUser(req),customer=validCustomer(req.data?.customer),{items,total}=await validatedItems(req.data?.items);
 const orderId="LUN"+crypto.randomBytes(5).toString("hex").toUpperCase();
 const amount=Math.round(total*100);
 const rp=razorpayClient();
 let rpOrder;
 try{rpOrder=await rp.orders.create({amount,currency:"INR",receipt:orderId,notes:{lunera_order_id:orderId,user_id:user.uid}});}
 catch(e){console.error("Razorpay order creation failed",e);throw new HttpsError("unavailable","Razorpay could not create a payment session. Please try again.");}
 const record={id:orderId,userId:user.uid,date:new Date().toISOString(),customer,items,total,status:"New",paymentStatus:"Pending",paymentMethod:"Razorpay",emailStatus:"Pending",razorpayOrderId:rpOrder.id,razorpayAmount:amount,razorpayCurrency:"INR",createdAt:FieldValue.serverTimestamp()};
 await db.collection("orders").doc(orderId).create(record);
 return {orderId,razorpayOrderId:rpOrder.id,amount,keyId:RAZORPAY_KEY_ID.value()};
});
exports.verifyRazorpayPayment=onCall({region:REGION,secrets:[RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET]},async req=>{
 const user=requireUser(req),orderId=clean(req.data?.orderId,40),rpOrderId=clean(req.data?.razorpayOrderId,80),paymentId=clean(req.data?.paymentId,80),signature=clean(req.data?.signature,256);
 if(!orderId||!rpOrderId||!paymentId||!/^[a-f0-9]{64}$/i.test(signature))throw new HttpsError("invalid-argument","Payment verification details are invalid.");
 const ref=db.collection("orders").doc(orderId),snap=await ref.get();
 if(!snap.exists)throw new HttpsError("not-found","Order not found.");
 const order=snap.data();
 if(order.userId!==user.uid||order.paymentMethod!=="Razorpay"||order.razorpayOrderId!==rpOrderId)throw new HttpsError("permission-denied","This payment does not belong to your order.");
 const expected=crypto.createHmac("sha256",RAZORPAY_KEY_SECRET.value()).update(rpOrderId+"|"+paymentId).digest("hex");
 const a=Buffer.from(expected,"hex"),b=Buffer.from(signature,"hex");
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))throw new HttpsError("permission-denied","Payment signature verification failed.");
 let payment;
 try{payment=await razorpayClient().payments.fetch(paymentId);}
 catch(e){console.error("Razorpay payment fetch failed",e);throw new HttpsError("unavailable","Could not confirm payment status with Razorpay.");}
 if(payment.order_id!==rpOrderId||payment.amount!==order.razorpayAmount||payment.currency!=="INR"||payment.status!=="captured")throw new HttpsError("failed-precondition","Payment is not captured or does not match this order.");
 await ref.update({paymentStatus:"Paid",status:"Confirmed",razorpayPaymentId:paymentId,paidAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
 return {paymentStatus:"Paid",items:order.items,total:order.total};
});
exports.razorpayWebhook=onRequest({region:REGION,secrets:[RAZORPAY_KEY_SECRET,RAZORPAY_WEBHOOK_SECRET]},async(req,res)=>{
 if(req.method!=="POST"){res.status(405).send("Method not allowed");return;}
 const supplied=String(req.get("x-razorpay-signature")||"");
 const expected=crypto.createHmac("sha256",RAZORPAY_WEBHOOK_SECRET.value()).update(req.rawBody).digest("hex");
 let a,b;try{a=Buffer.from(expected,"hex");b=Buffer.from(supplied,"hex");}catch(_){res.status(400).send("Invalid signature");return;}
 if(!supplied||a.length!==b.length||!crypto.timingSafeEqual(a,b)){res.status(400).send("Invalid signature");return;}
 const event=req.body?.event,payment=req.body?.payload?.payment?.entity,rzOrder=req.body?.payload?.order?.entity;
 try{
  if(["payment.captured","order.paid","payment.failed"].includes(event)){
   const rpOrderId=payment?.order_id||rzOrder?.id;
   if(rpOrderId){
    const found=await db.collection("orders").where("razorpayOrderId","==",rpOrderId).limit(1).get();
    if(!found.empty){
     const doc=found.docs[0],o=doc.data();
     if(event==="payment.failed"&&o.paymentStatus!=="Paid"){
      await doc.ref.update({paymentStatus:"Failed",razorpayPaymentId:payment?.id||null,updatedAt:FieldValue.serverTimestamp()});
     }else if((event==="payment.captured"||event==="order.paid")&&payment&&payment.status==="captured"&&payment.amount===o.razorpayAmount&&payment.currency==="INR"){
      await doc.ref.update({paymentStatus:"Paid",status:"Confirmed",razorpayPaymentId:payment.id,paidAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
     }
    }
   }
  }
  res.status(200).json({received:true});
 }catch(e){console.error("Razorpay webhook processing failed",e);res.status(500).send("Webhook processing failed");}
});