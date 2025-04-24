const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

// Firebase Admin初期化
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// ミドルウェア: 認証確認
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    res.status(401).json({ error: '認証に失敗しました' });
  }
};

// ユーザー登録
app.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // ユーザーを作成
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Firestoreにユーザー情報を保存
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'ユーザーが正常に作成されました' });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    res.status(500).json({ error: 'ユーザーの作成に失敗しました' });
  }
});

// 予約作成
app.post('/reservations', authenticateUser, async (req, res) => {
  try {
    const { date, time, numberOfPeople } = req.body;
    const userId = req.user.uid;

    // 予約情報をFirestoreに保存
    const reservationRef = await admin.firestore().collection('reservations').add({
      userId,
      date,
      time,
      numberOfPeople,
      status: 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: reservationRef.id,
      message: '予約が正常に作成されました',
    });
  } catch (error) {
    console.error('予約作成エラー:', error);
    res.status(500).json({ error: '予約の作成に失敗しました' });
  }
});

// 予約一覧取得
app.get('/reservations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const reservationsSnapshot = await admin.firestore()
      .collection('reservations')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    const reservations = [];
    reservationsSnapshot.forEach(doc => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(reservations);
  } catch (error) {
    console.error('予約取得エラー:', error);
    res.status(500).json({ error: '予約の取得に失敗しました' });
  }
});

// 予約可能時間の取得
app.get('/available-times', async (req, res) => {
  try {
    const { date } = req.query;
    
    // 指定された日付の予約済み時間を取得
    const reservationsSnapshot = await admin.firestore()
      .collection('reservations')
      .where('date', '==', date)
      .get();

    // 予約済み時間のマップを作成
    const reservedTimes = {};
    reservationsSnapshot.forEach(doc => {
      const data = doc.data();
      reservedTimes[data.time] = true;
    });

    // 利用可能な時間枠（17:30から20:30まで、30分間隔）
    const allTimes = [
      '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
    ];

    // 予約可能な時間枠をフィルタリング
    const availableTimes = allTimes.filter(time => !reservedTimes[time]);

    res.json({ availableTimes });
  } catch (error) {
    console.error('時間枠取得エラー:', error);
    res.status(500).json({ error: '予約可能時間の取得に失敗しました' });
  }
});

// メール送信用のトランスポーター設定
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

// 予約確認メール送信
exports.sendReservationConfirmation = functions.https.onCall(async (data, context) => {
  // 認証確認
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
  }

  const { to, reservation } = data;

  const mailOptions = {
    from: '"お寿司予約システム" <noreply@osusi-reservation.com>',
    to: to,
    subject: '【お寿司予約システム】ご予約ありがとうございます',
    html: `
      <h2>ご予約ありがとうございます</h2>
      <p>${reservation.name} 様</p>
      <p>以下の内容でご予約を承りました。</p>
      
      <h3>ご予約内容</h3>
      <ul>
        <li>日時: ${reservation.formattedDate} ${reservation.formattedTime}</li>
        <li>人数: ${reservation.numberOfPeople}名様</li>
        ${reservation.hasAllergy === 'yes' ? `<li>アレルギー: ${reservation.allergyDetails}</li>` : ''}
        ${reservation.notes ? `<li>備考: ${reservation.notes}</li>` : ''}
      </ul>
      
      <p>ご来店をお待ちしております。</p>
      
      <hr>
      <p>
        ※このメールは自動送信されています。<br>
        ご不明な点がございましたら、お手数ですが当店までご連絡ください。
      </p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new functions.https.HttpsError('internal', 'メール送信に失敗しました');
  }
});

// 予約リマインダーメール送信（毎時実行）
exports.sendReservationReminders = functions.pubsub.schedule('0 * * * *').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const in24Hours = new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000);
  
  try {
    const reservationsRef = admin.firestore().collection('reservations');
    const snapshot = await reservationsRef
      .where('date', '>', now.toDate())
      .where('date', '<=', in24Hours)
      .where('reminderSent', '==', false)
      .get();

    const promises = [];
    
    snapshot.forEach(doc => {
      const reservation = doc.data();
      
      const mailOptions = {
        from: '"お寿司予約システム" <noreply@osusi-reservation.com>',
        to: reservation.userEmail,
        subject: '【お寿司予約システム】明日のご予約のお知らせ',
        html: `
          <h2>ご予約のリマインダー</h2>
          <p>${reservation.name} 様</p>
          <p>明日のご予約についてお知らせいたします。</p>
          
          <h3>ご予約内容</h3>
          <ul>
            <li>日時: ${reservation.formattedDate} ${reservation.formattedTime}</li>
            <li>人数: ${reservation.numberOfPeople}名様</li>
          </ul>
          
          <p>ご来店をお待ちしております。</p>
          
          <hr>
          <p>
            ※このメールは自動送信されています。<br>
            ご不明な点がございましたら、お手数ですが当店までご連絡ください。
          </p>
        `
      };

      promises.push(
        transporter.sendMail(mailOptions)
          .then(() => {
            return doc.ref.update({ reminderSent: true });
          })
      );
    });

    await Promise.all(promises);
    return null;
  } catch (error) {
    console.error('Failed to send reminders:', error);
    return null;
  }
});

// Express appをCloud Functionsにエクスポート
exports.api = functions.region('asia-northeast1').https.onRequest(app); 