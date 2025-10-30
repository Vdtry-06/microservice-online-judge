# microservice-online-judge

## I. Structure:
```
1. api-gateway
2. nginx
3. judge-service
4. problem-service
5. submission-service
6. frontend
7. load-testing
```

## II. Guide
```
1. docker-compose up --build : to build server
2. docker-compose down : to turn off server
3. load-testing : test concurrent request
    + cd load-testing
    + npm init -y
    + npm install axios
    + node load-test.js 
        [10 5]
        [50 10]
        [100 20]
        [500 10]
    + note : [user, request]
```