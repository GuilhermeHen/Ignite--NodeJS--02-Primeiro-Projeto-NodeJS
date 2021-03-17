const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

// middleware se o usuario existe
function accountExits(request, response, next){
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if(!customer) {
    return response.status(400).json({ error: 'Customer not found!'});
  } else {

    request.customer = customer;

    return next();
  }
}

function getBalance(statement){
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

// Criar conta
app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerCpfExists = customers.some((customer) => customer.cpf === cpf);

  if(customerCpfExists) {
    return response.status(400).json({ error: 'Customer already Exists!'});
  }

  const customer = {
    id: uuidv4(),
    name,
    cpf,
    statement: [],
  }

  customers.push(customer);

  return response.status(201).json(customer);
});

// Consultar Saldo
app.get('/statement', accountExits, (request, response) => {
  const { customer } = request;

  return response.status(200).json(customer.statement);

});

// Criar um deposito
app.post('/deposit', accountExits, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    create_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return response.status(201).json({ message: 'Deposit Success!'})

})

// Fazer um saque
app.post('/withdraw', accountExits, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return response.status(400).json({ message: 'Insufficient funds!'});
  } else {
    const statementOperation = {
      amount,
      create_at: new Date(),
      type: 'debit',
    };

    customer.statement.push(statementOperation);

    const newBalance = balance - amount;

    return response.status(201).json({ message: 'Withdraw Success!', newBalance});
  }
});

// Consultar deposito por data
app.get('/statement/date', accountExits, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter((statement) => statement.create_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(customer.statement);

})

// Atualizar dados do cliente
app.put('/account', accountExits, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(201).json(customer);
})

// dados do cliente
app.get('/account', accountExits, (request, response) => {
  const { customer } = request;

  return response.status(201).json(customer);
})

// deletar conta
app.delete('/account', accountExits, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
})

app.listen(3333);
