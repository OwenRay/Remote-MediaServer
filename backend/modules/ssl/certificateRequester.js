const core = require('../../core');
const Settings = require('../../core/Settings');
const https = require('https');
const querystring = require('querystring');
const ip = require('ip');
const crypto = require('crypto');
const HttpServer = require('../../core/http');
const acme = require('acme-client');
const Log = require('../../core/Log');
const dns = require('dns');


const get = url => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    if (res.statusCode === 200) resolve(res);
    else reject(res);
  });
});

async function waitForTxt(domain, txt, tryCount = 0) {
  if (tryCount > 10) return false;

  return new Promise((resolve) => {
    setTimeout(() => {
      dns.resolveTxt(domain, (err, [res]) => {
        Log.debug('got txtrecord', res, tryCount);
        if (err || !res || txt !== res[0]) {
          return waitForTxt(domain, txt, tryCount + 1).then(resolve);
        }
        return resolve();
      });
    }, tryCount * 2000);
  });
}

async function setupCerts(changed) {
  try {
    if (!Settings.getValue('sslemail') ||
      !Settings.getValue('ssldomain') ||
      !Settings.getValue('sslport')) {
      return;
    }
    Log.notifyUser('toast', 'requesting certificate');

    if (changed !== 'ssldomain' &&
      Settings.getValue('ssl').expire - new Date().getTime() > 0) {
      return;
    }
    Settings.setValue('ssl', {});

    const client = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production,
      accountKey: await acme.forge.createPrivateKey(),
      challengePriority: ['dns-01'],
    });

    try {
      client.getAccountUrl();
    } catch (e) {
      await client.createAccount({
        termsOfServiceAgreed: true,
        contact: [`mailto:${Settings.getValue('sslemail')}`],
      });
    }

    const subdomain = Settings.getValue('ssldomain');
    /* Place new order */
    const order = await client.createOrder({
      identifiers: [
        {
          type: 'dns',
          value: `${subdomain}.theremote.io`,
        },
      ],
    });

    /* Get authorizations and select challenges */
    const [authz] = await client.getAuthorizations(order);

    const challenge = authz.challenges.find(o => o.type === 'dns-01');
    const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);

    if (!Settings.getValue('sslpassword')) {
      Settings.setValue('sslpassword', crypto.randomBytes(32)
        .toString('hex'));
      Settings.save();
    }

    const params = {
      name: subdomain,
      password: Settings.getValue('sslpassword'),
      token: keyAuthorization,
      ip: ip.address(),
    };
    await get(`https://certification.theremote.io:8335/?${querystring.stringify(params)}`);

    Log.notifyUser('toast', 'waiting for certificate validation');
    await waitForTxt(`_acme-challenge.${params.name}.theremote.io`, keyAuthorization);

    /* Notify ACME provider that challenge is satisfied */
    await client.completeChallenge(challenge);

    /* Wait for ACME provider to respond with valid status */
    await client.waitForValidStatus(challenge);


    const [key, csr] = await acme.forge.createCsr({
      commonName: `${subdomain}.theremote.io`,
    });

    await client.finalizeOrder(order, csr);
    const cert = await client.getCertificate(order);


    /* Done */
    Settings.setValue('ssl', {
      key: key.toString(),
      cert: cert.toString(),
      expire: new Date().getTime() + (30 * 24 * 60 * 60 * 1000),
    });
    Settings.save();

    Log.notifyUser('toast', 'certificate successfully request, restarting...');

    HttpServer.stop(HttpServer.start);
  } catch (e) {
    Log.notifyUser('toast', 'could not request certificate for given subdomain');
  }
}


Settings.addObserver('sslport', setupCerts);
Settings.addObserver('ssldomain', setupCerts);
Settings.addObserver('sslredirect', setupCerts);

setInterval(setupCerts, 24 * 60 * 60 * 1000);


core.addBeforeStartListener(setupCerts);
