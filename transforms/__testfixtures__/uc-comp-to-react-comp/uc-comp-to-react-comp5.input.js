import { Row } from "uc_components";
import React from "react";

const { Col } = Row;
const { test } = Row;

export default () => (
  <div>
    <Row>
      <Row.Col span={2}>
        <div>1</div>
      </Row.Col>
      <Row.Col span={2}>
        <div>2</div>
      </Row.Col>
      <Row.Col span={2}>
        <div>23</div>
      </Row.Col>
      <Col span={2}>
        <div>24</div>
      </Col>
    </Row>
  </div>
);
