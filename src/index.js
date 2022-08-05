const { loadScript } = require('@paypal/paypal-js');

const Payment = function (settings, axios) {
  this.settings = settings;
  this.axios = axios;
  this.stripe = Stripe(settings.key);
  this.customer = settings.customer;

  // TODO remove __proto__ and declare methods in a class
  this.__proto__ = {
    requestPayment(payment_method, options) {
      return this.axios.post('/payment/request', {
        return_url: this.settings.callback,
        payment_method,
        ...options,
      });
    },

    cardList() {
      return this.axios.get('/payment/cards');
    },

    createNewCard(cardData) {
      return this.axios.post('/payment/cards', cardData);
    },

    deleteCard(card) {
      return this.axios.delete(`/payment/cards/${card}`);
    },

    alipay(options) {
      return this.requestPayment('alipay', options).then(({ data }) => {
        this.stripe
          .confirmAlipayPayment(data.response.client_secret, {
            return_url: data.callback,
          });
      });
    },

    wechat_pay(options) {
      return this.requestPayment('wechat_pay', options).then(({ data }) => {
        this.stripe
          .confirmWechatPayPayment(data.response.client_secret, {
            payment_method_options: {
              wechat_pay: { client: 'web' },
            },
          })
          .then(({ error, paymentIntent }) => {
            if (error) {
              // Inform the customer that there was an error.
              console.error(error);
            } else {
              console.log(data, paymentIntent);
              // this.axios.post(data.callback, paymentIntent)
              //   .then(console.log)
              //   .catch(console.error)
            }
          });
      });
    },

    // No need to use this init card method, as we maintain card crud.
    initCard(cardId) {
      const element = this.stripe.elements();
      this.cardElem = element.create('card');
      this.cardElem.mount(cardId);
    },

    async initPaypalBtn(btnId, { currency, amount, callback }) {
      currency = currency.toUpperCase();
      amount = (Number(amount) / 100).toFixed(2);

      const paymentPkg = this;
      let paypal = null;

      try {
        paypal = await loadScript({
          'client-id': paymentPkg.settings.paypalClientId,
          currency,
        });
      } catch (error) {
        console.error('failed to load the PayPal JS SDK script', error);
      }
      if (paypal) {
        try {
          await paypal
            .Buttons({
              style: {
                layout: 'horizontal',
                color: 'black',
                tagline: false,
              },
              createOrder(data) {
                // Set up the transaction
                console.log('Create Order Data:', data);
                const getOrderId = ({ additional_info }) => paymentPkg.requestPayment('paypal', { currency, amount, additional_info })
                  .then(({ data }) => data.response)
                  .then(({ id }) => id)
                  .catch(console.error);
                if (typeof (callback) === 'function') {
                  return callback().then(getOrderId).catch(err => {
                    console.log('Error: ', err);
                  });
                }
                return getOrderId();
              },
              onApprove(data) {
                // This function captures the funds from the transaction.
                const { orderID } = data;
                return paymentPkg.axios.post(`payment/paypal/order/${orderID}/capture`)
                  .then(order => {
                    console.log(order);
                    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'SUCCESS' }));
                  })
                  .then(() => {
                    window.location.href = paymentPkg.settings.callback;
                  })
                  .catch(console.error);
                // return actions.order.capture().then(details => {
                //   // This function shows a transaction success message to your buyer.
                //   // TODO emit event
                //   console.log(
                //     `Transaction completed by ${details.payer.name.given_name}`
                //   );
                // });
              },
              onCancel({ orderID }) {
                // Show a cancel page, or return to cart
                paymentPkg.axios.post('/payment/callback', {
                  payment_intent: orderID,
                  redirect_status: 'canceled',
                  dont_redirect: true,
                }).then(() => {
                  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'CANCELLED' }));
                });
              },
              onError(err) {
                // For example, redirect to a specific error page
                console.error(err);
                // window.location.href = "/your-error-page-here";
                const msg = { err, status: 'FAILED' };
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg));
              },
            })
            .render(btnId);
        } catch (error) {
          console.error('failed to render the PayPal Buttons', error);
        }
      }
    },

    // Depricated way of making card payment
    cardDepricated(options) {
      return this.requestPayment('card', options).then(({ data }) => {
        this.stripe
          .confirmCardPayment(data.response.client_secret, {
            payment_method: { card: this.cardElem },
          })
          .then(result => {
            if (result.error) {
              // Inform the customer that there was an error.
              console.error(error);
            }
            console.log('Possibly successful payment');
            console.log(result);
          })
          .catch(console.error);
      });
    },

    card(options) {
      return this.requestPayment('card', options)
        .then(res => {
          console.log(res);
          return res;
        })
        .catch(console.error);
    },

    multibanco(options) {
      return this.requestPayment('multibanco', options)
        .then(({ data }) => data.response)
        .then(({
          multibanco, status, currency, amount,
        }) => ({
          multibanco: {
            entity: multibanco.entity,
            reference: multibanco.reference,
          },
          status,
          currency,
          amount,
        }));
    },

    pay({ payment_method, ...options }) {
      return this[payment_method](options);
    },

    bank_transfer(options) {
      return this.requestPayment('bank_transfer', options);
    },

    cash(options) {
      return this.requestPayment('cash', options);
    },

    ack(id, status) {
      return this.axios.put(`/payment/instances/${id}/ack`, { status });
    },

    get(query) {
      return this.axios.get('/payment/instances', query);
    },

    enabledPaymentMethods(specification = '') {
      return this.axios.get(`/payment/enabled-methods/${specification}`);
    },

  };
};

module.exports = Payment;
