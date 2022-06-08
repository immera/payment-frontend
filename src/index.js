const { loadScript } = require('@paypal/paypal-js');

const Payment = (settings, axios) => {
  this.settings = settings;
  // TODO remove axios and use fetch instead
  this.axios = axios;
  // TODO import Stripe(?)
  this.stripe = Stripe(settings.key);
  this.paypal = null;

  // TODO remove __proto__ and declare methods in a class
  this.__proto__ = {
    requestPayment(payment_method, options) {
      return this.axios.post('/payment/request', {
        return_url: this.settings.callback,
        payment_method,
        ...options,
      });
    },

    alipay(options) {
      return this.requestPayment('alipay', options).then(({ data }) => {
        this.stripe
          .confirmAlipayPayment(data.response.client_secret, {
            return_url: data.callback,
          })
          .then(result => {
            if (result.error) {
              // Inform the customer that there was an error.
              console.error(error);
            }
          })
          .catch(console.error);
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

    initCard(cardId) {
      const element = this.stripe.elements();
      this.cardElem = element.create('card');
      this.cardElem.mount(cardId);
    },

    async initPaypalBtn(btnId, { currency, amount }) {
      currency = currency.toUpperCase();
      amount = (number(amount) / 100).toFixed(2);

      try {
        this.paypal = await loadScript({
          'client-id': 'test',
          currency,
        });
      } catch (error) {
        console.error('failed to load the PayPal JS SDK script', error);
      }
      if (paypal) {
        try {
          await this.paypal
            .Buttons({
              style: {
                layout: 'horizontal',
                color: 'blue',
                tagline: false,
              },
              createOrder(data, actions) {
                // Set up the transaction
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        currency_code: currency,
                        value: amount,
                      },
                    },
                  ],
                });
              },
              onApprove(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(details => {
                  // This function shows a transaction success message to your buyer.
                  // TODO emit event
                  console.log(
                    `Transaction completed by ${details.payer.name.given_name}`
                  );
                });
              },
              onCancel(data) {
                // Show a cancel page, or return to cart
                console.log('Cancelled !!!', data);
              },
              onError(err) {
                // For example, redirect to a specific error page
                console.error(err);
                // window.location.href = "/your-error-page-here";
              },
            })
            .render(btnId);
        } catch (error) {
          console.error('failed to render the PayPal Buttons', error);
        }
      }
    },

    card(options) {
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

    multibanco(options) {
      return this.requestPayment('multibanco', options)
        .then(({ data }) => data.response)
        .then(({ multibanco, status, currency, amount }) => ({
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

    ack(id, status) {
      return this.axios.put(`/payment/instances/${id}/ack`, { status });
    },

    get(query) {
      return this.axios.get('/payment/instances', query);
    },
  };
};

module.exports = Payment;
